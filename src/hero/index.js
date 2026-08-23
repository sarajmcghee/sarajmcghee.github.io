/**
 * Hero canvas — progressive enhancement.
 *
 * The hero text is plain HTML and paints without any of this. Nothing here is
 * imported until after first paint, and the scene lives in its own chunk, so a
 * visitor whose browser or preferences rule the canvas out never downloads
 * three.js at all.
 *
 * The ladder:
 *   prefers-reduced-motion   → nothing. Not slowed, off.
 *   Save-Data or <4GB memory → nothing.
 *   viewport under 1024px    → nothing, but reversible; see below.
 *   WebGPU                   → WGSL, full leaf count.
 *   WebGL2                   → the same TSL compiled to GLSL, a third of the leaves.
 *   anything else, or a throw → nothing, silently.
 *
 * The width gate is deliberately *not* a one-shot check. Someone who opens the
 * page in a narrow window and then maximises it should get the canvas, and
 * someone who drags the window narrow should get their text column back — so the
 * gate mounts and unmounts across the breakpoint instead of deciding once at
 * startup and never revisiting it.
 */

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const MIN_WIDTH = 1024;

const CANVAS_MASK = [
  "linear-gradient(100deg, transparent 0%, transparent 46%, rgba(0,0,0,0.42) 66%, #000 88%)",
  "linear-gradient(to bottom, transparent 0%, #000 18%, #000 78%, transparent 100%)",
].join(",");

/* Debug override, so the ladder can be exercised on a machine that supports the
   top rung. ?hero=webgl forces the WebGL2 path, ?hero=off skips the canvas.
   Untrusted input, so it's read as an exact match only. */
function heroOverride() {
  const v = new URLSearchParams(window.location.search).get("hero");
  return v === "webgl" || v === "off" ? v : null;
}

/** Conditions that won't change during the session. */
function hardSkip() {
  if (typeof window === "undefined") return true;
  if (heroOverride() === "off") return true;
  if (navigator.connection?.saveData) return true;
  if (navigator.deviceMemory && navigator.deviceMemory < 4) return true;
  return false;
}

function afterFirstPaint() {
  return new Promise((resolve) => {
    const go = () =>
      "requestIdleCallback" in window
        ? requestIdleCallback(resolve, { timeout: 1800 })
        : setTimeout(resolve, 220);

    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
  });
}

export async function mountHero(slot) {
  if (!slot || hardSkip()) return null;

  const motion = window.matchMedia(REDUCED_MOTION);
  const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");

  let canvas = null;
  let scene = null;
  let io = null;
  let themeObserver = null;
  let building = false;
  let destroyed = false;
  /* Whether *this* instance is the one currently showing. StrictMode mounts the
     effect twice in dev, and the width gate tears down and rebuilds, so a
     disposed instance must not clear a flag a live one set. */
  let live = false;

  const wideEnough = () => window.innerWidth >= MIN_WIDTH && !motion.matches;

  const readTheme = () => {
    const stamped = document.documentElement.getAttribute("data-theme");
    if (stamped === "dark" || stamped === "light") return stamped;
    return colorScheme.matches ? "dark" : "light";
  };

  const syncTheme = () => scene?.applyTheme(readTheme());

  function teardown() {
    if (live) {
      slot.removeAttribute("data-live"); // poster comes back
      live = false;
    }
    io?.disconnect();
    io = null;
    themeObserver?.disconnect();
    themeObserver = null;
    scene?.dispose();
    scene = null;
    canvas?.remove();
    canvas = null;
  }

  async function build() {
    if (scene || building || destroyed || !wideEnough()) return;
    building = true;

    canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    /* Masked away from the left of the hero, where the headline and body copy
       live. Legibility isn't something the decoration gets to compete with, and
       a mask is cheaper and more reliable than trying to keep the simulation
       out of that region. */
    canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;" +
      "transition:opacity 900ms ease;" +
      `-webkit-mask-image:${CANVAS_MASK};mask-image:${CANVAS_MASK};` +
      "-webkit-mask-composite:source-in;mask-composite:intersect;";
    slot.appendChild(canvas);

    try {
      const { createScene } = await import("./scene.js");
      scene = await createScene(canvas, { forceWebGL: heroOverride() === "webgl" });
    } catch (err) {
      canvas.remove();
      canvas = null;
      building = false;
      if (import.meta.env?.DEV) console.warn("hero canvas unavailable:", err);
      return;
    }

    // Conditions can change while the chunk and the model are in flight.
    if (destroyed || !wideEnough()) {
      building = false;
      teardown();
      return;
    }

    scene.start();

    /* Read a layout property to flush the freshly-inserted canvas before setting
       opacity, so the transition actually runs. Doing this in requestAnimationFrame
       instead loses the callback whenever a rebuild swaps the canvas underneath it. */
    void canvas.offsetHeight;
    canvas.style.opacity = "1";
    slot.setAttribute("data-live", "true"); // crossfades the poster out
    live = true;

    io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? scene?.start() : scene?.stop()),
      { threshold: 0 }
    );
    io.observe(slot);

    /* The canvas outlives a theme toggle, so it has to follow one — the toggle
       stamps data-theme on <html>, and an un-stamped page follows the OS. */
    themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    building = false;
  }

  const onVisibility = () => (document.hidden ? scene?.stop() : scene?.start());
  const onWidth = () => (wideEnough() ? build() : teardown());
  const onMotion = () => (motion.matches ? teardown() : build());

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("resize", onWidth, { passive: true });
  motion.addEventListener("change", onMotion);
  colorScheme.addEventListener("change", syncTheme);

  await afterFirstPaint();

  // Skip the initial build if the visitor already scrolled past the hero.
  if (!destroyed && slot.getBoundingClientRect().bottom >= 0) await build();

  return {
    get backend() {
      return scene?.backend ?? null;
    },
    dispose() {
      destroyed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onWidth);
      motion.removeEventListener("change", onMotion);
      colorScheme.removeEventListener("change", syncTheme);
      teardown();
    },
  };
}
