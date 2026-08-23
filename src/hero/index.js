/**
 * Hero canvas — progressive enhancement.
 *
 * The hero text is plain HTML and paints without any of this. Nothing here is
 * imported until after first paint, and the scene lives in its own chunk, so a
 * visitor whose browser or preferences rule the canvas out never downloads
 * three.js at all.
 *
 * The ladder:
 *   prefers-reduced-motion   → poster only. Not slowed, off.
 *   Save-Data / <4GB / 2G    → poster only. 760 KB of scene is not worth it there.
 *   WebGPU                   → WGSL, full leaf count.
 *   WebGL2                   → the same TSL compiled to GLSL, a third of the leaves.
 *   anything else, or a throw → poster only, silently.
 *
 * Phones animate too, on a much smaller budget: the mobile framing renders under
 * a third of the leaves and a smaller tree, tucked into the corner away from the
 * copy. The earlier version blocked mobile outright, which cost the tree — the
 * whole point of the hero — to save an animation nobody had measured.
 *
 * Framing is chosen by breakpoint and shared with the poster, so the crossfade
 * is between two versions of the same picture. When they disagree it reads as a
 * jump instead of a fade.
 *
 * The breakpoint is deliberately *not* a one-shot check: crossing it tears the
 * scene down and rebuilds it in the other framing.
 */

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const DESKTOP_WIDTH = 1024;

const framingFor = (w) => (w >= DESKTOP_WIDTH ? "desktop" : "mobile");

/* Masks match the poster's, per framing, for the same reason the framings do. */
const CANVAS_MASK = {
  desktop: [
    "linear-gradient(100deg, transparent 0%, transparent 46%, rgba(0,0,0,0.42) 66%, #000 88%)",
    "linear-gradient(to bottom, transparent 0%, #000 18%, #000 78%, transparent 100%)",
  ].join(","),
  mobile: [
    "linear-gradient(to right, transparent 0%, transparent 34%, #000 66%)",
    "linear-gradient(to bottom, transparent 0%, transparent 56%, #000 78%)",
  ].join(","),
};

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
  // ~760 KB of scene has no business downloading over a 2G connection.
  const conn = navigator.connection?.effectiveType;
  if (conn === "slow-2g" || conn === "2g") return true;
  return false;
}

/* Start the network work as soon as the module runs, so the three.js chunk and
   the tree download *during* the idle wait rather than after it. This is most of
   the delay the poster was covering. */
let scenePromise = null;
function preloadScene() {
  if (scenePromise) return scenePromise;
  scenePromise = import("./scene.js");
  // Warm the model too; createScene fetches it and it is the larger asset.
  fetch("/assets/trees/red-maple.glb", { priority: "low" }).catch(() => {});
  return scenePromise;
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

/* The head script has already decided this, but say it again from here so the
   two can't drift, and so a runtime failure can fall back to the poster. */
function showPoster() {
  document.documentElement.setAttribute("data-hero", "poster");
}

export async function mountHero(slot) {
  if (!slot) return null;
  if (hardSkip()) {
    showPoster();
    return null;
  }

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

  const allowed = () => !motion.matches;
  let framing = framingFor(window.innerWidth);

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
    if (scene || building || destroyed || !allowed()) return;
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
      `-webkit-mask-image:${CANVAS_MASK[framing]};mask-image:${CANVAS_MASK[framing]};` +
      "-webkit-mask-composite:source-in;mask-composite:intersect;";
    slot.appendChild(canvas);

    try {
      const { createScene } = await preloadScene();
      scene = await createScene(canvas, { forceWebGL: heroOverride() === "webgl", framing });
    } catch (err) {
      canvas.remove();
      canvas = null;
      building = false;
      showPoster(); // no canvas after all — reveal the still
      if (import.meta.env?.DEV) console.warn("hero canvas unavailable:", err);
      return;
    }

    // Conditions can change while the chunk and the model are in flight.
    if (destroyed || !allowed()) {
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
  /* Crossing the breakpoint rebuilds in the other framing rather than just
     hiding the canvas. */
  const onWidth = () => {
    const next = framingFor(window.innerWidth);
    if (next === framing && scene) return;
    framing = next;
    teardown();
    build();
  };
  const onMotion = () => {
    if (motion.matches) {
      showPoster();
      teardown();
    } else {
      build();
    }
  };

  preloadScene();

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
