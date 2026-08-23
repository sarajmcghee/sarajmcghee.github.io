import * as THREE from "three/webgpu";
import {
  Fn,
  attribute,
  positionLocal,
  uniform,
  time,
  sin,
  cos,
  float,
  vec3,
  vec4,
  mod,
  smoothstep,
} from "three/tsl";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const MODEL_URL = "/assets/trees/red-maple.glb";

/* Leaf budget by backend. Both run the same TSL, which compiles to WGSL or GLSL
   depending on where it lands; WebGPU simply gets more of them.

   These counts are deliberately small. The first version ran 24,000 leaves —
   which the GPU handled fine and which looked like confetti. A few hundred
   drifting leaves reads as autumn; tens of thousands reads as noise, and noise
   over a headline is a worse outcome than no canvas at all. */
const LEAF_COUNT = { webgpu: 2200, webgl: 900 };

const THEME = {
  light: { leaf: 0xa8322b, leafAlt: 0xc4693f, bark: 0x7c6a54, key: 0xfff6e8, fill: 0xbcd0c4 },
  dark: { leaf: 0xe2685a, leafAlt: 0xc4693f, bark: 0xb39b7c, key: 0xffe9cc, fill: 0x2b4a44 },
};

function currentTheme() {
  const stamped = document.documentElement.getAttribute("data-theme");
  if (stamped === "dark") return "dark";
  if (stamped === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Leaf drift, written once in TSL.
 *
 * Each instance carries a seed. Vertical fall is time plus seed, wrapped with
 * mod() so leaves recycle without any CPU bookkeeping — no per-frame buffer
 * writes, no array of particle objects. Horizontal sway is two sines at
 * unrelated frequencies, which reads as air rather than as a wave.
 */
const leafPosition = Fn(([seed, spread, height, fallSpeed, swayAmount, clusterX]) => {
  const t = time.mul(fallSpeed).add(seed.mul(97.0));

  // Wrap fall height so the column of leaves is endless.
  const y = height.div(2.0).sub(mod(t.add(seed.mul(31.0)), height));

  const swayX = sin(t.mul(0.7).add(seed.mul(11.0))).mul(swayAmount);
  const swayZ = cos(t.mul(0.53).add(seed.mul(7.0))).mul(swayAmount);

  // Spread the column across the frame, deterministic per seed.
  const baseX = sin(seed.mul(123.4)).mul(spread).add(clusterX);
  const baseZ = cos(seed.mul(76.1)).mul(spread.mul(0.7));

  return vec3(baseX.add(swayX), y, baseZ.add(swayZ));
});

/* poster: render a still for the mobile and reduced-motion fallback. Skips the
   fade-in and recomposes for a portrait frame, where the narrower horizontal FOV
   otherwise pushes the tree off the right edge. */
export async function createScene(canvas, { onReady, forceWebGL = false, poster = false } = {}) {
  const backendIsWebGPU = Boolean(navigator.gpu) && !forceWebGL;
  const theme = THEME[currentTheme()];

  const renderer = new THREE.WebGPURenderer({
    canvas,
    antialias: true,
    alpha: true,
    forceWebGL: !backendIsWebGPU,
  });
  renderer.setClearAlpha(0);
  await renderer.init();

  // What the renderer actually resolved to, which is not always what we asked for.
  const backend = renderer.backend?.isWebGPUBackend ? "webgpu" : "webgl";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
  camera.position.set(0, 1.4, poster ? 10.5 : 8.5);
  camera.lookAt(0, 1.1, 0);

  scene.add(new THREE.HemisphereLight(theme.key, theme.fill, 2.1));
  const key = new THREE.DirectionalLight(theme.key, 1.5);
  key.position.set(4, 7, 5);
  scene.add(key);

  /* ---------- leaves ---------- */

  /* A still needs far fewer leaves than a moving scene: motion lets the eye read
     a dense field as air, but frozen it just reads as noise. */
  const count = poster ? 520 : LEAF_COUNT[backend];
  const leafGeo = new THREE.PlaneGeometry(0.042, 0.06);

  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) seeds[i] = Math.random() * 6.283;
  leafGeo.setAttribute("leafSeed", new THREE.InstancedBufferAttribute(seeds, 1));

  const seed = attribute("leafSeed", "float");
  // Cluster the fall around the tree on the right rather than filling the frame.
  const spread = uniform(float(2.2));
  const height = uniform(float(10.0));
  const fallSpeed = uniform(float(0.5));
  const sway = uniform(float(0.5));
  const clusterX = uniform(float(poster ? 1.15 : 3.0));
  const opacity = uniform(float(0));

  const leafMat = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const offset = leafPosition(seed, spread, height, fallSpeed, sway, clusterX);
  // Billboard the quad, then push it to its drifting position.
  const spin = time.mul(0.6).add(seed.mul(19.0));
  const spun = vec3(
    positionLocal.x.mul(cos(spin)).sub(positionLocal.y.mul(sin(spin))),
    positionLocal.x.mul(sin(spin)).add(positionLocal.y.mul(cos(spin))),
    positionLocal.z
  );
  leafMat.positionNode = spun.add(offset);

  /* Two-tone: seed splits the population between maple red and a warmer amber.
     Both are uniforms rather than baked constants so the palette can follow a
     theme change without rebuilding the node graph. */
  const tint = smoothstep(float(-0.2), float(0.2), sin(seed.mul(53.0)));
  const colA = uniform(vec3(...new THREE.Color(theme.leaf).toArray()));
  const colB = uniform(vec3(...new THREE.Color(theme.leafAlt).toArray()));
  leafMat.colorNode = vec4(colA.mix(colB, tint), opacity);

  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, count);
  leaves.frustumCulled = false;
  scene.add(leaves);

  /* ---------- tree ---------- */

  let tree = null;
  const barkMaterials = [];
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  try {
    const gltf = await loader.loadAsync(MODEL_URL);
    tree = gltf.scene;

    // Normalize whatever the export gave us to a predictable on-screen height.
    const box = new THREE.Box3().setFromObject(tree);
    const size = new THREE.Vector3();
    box.getSize(size);
    const scale = 6.2 / (size.y || 1);
    tree.scale.setScalar(scale);
    box.setFromObject(tree);
    tree.position.y = -box.min.y - 3.1;
    tree.position.x = poster ? 1.2 : 3.1;

    /* The export is two untextured meshes: "trunk" at 30k triangles, and
       "foliage" at 954 — a few dozen flat cards that only ever worked because
       the original had a leaf texture on them. Rendered as a silhouette they
       read as confetti glued to the branches.

       So the foliage mesh is dropped and the branches are kept. The drifting
       leaves become the canopy instead, which is both a better picture — a
       maple mid-shed — and the honest use of the geometry that's actually
       good. */
    tree.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = false;
      o.receiveShadow = false;

      if (/foliage/i.test(o.name) || /foliage/i.test(o.material?.name ?? "")) {
        o.visible = false;
        return;
      }

      const mat = new THREE.MeshBasicNodeMaterial({
        color: new THREE.Color(theme.bark),
        transparent: true,
        opacity: poster ? 0.82 : 0.62,
        depthWrite: false,
      });
      barkMaterials.push(mat);
      o.material = mat;
    });
    scene.add(tree);
  } catch {
    // No tree is survivable — the leaves carry the effect on their own.
  }

  onReady?.({ backend, count });
  if (typeof window !== "undefined") window.__hero = { backend, count };

  /* ---------- loop ---------- */

  let raf = 0;
  let running = false;
  let fadeIn = poster ? 1 : 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function frame() {
    raf = requestAnimationFrame(frame);

    if (!poster) fadeIn = Math.min(fadeIn + 0.012, 1);
    // A still carries less than a moving scene, so the poster sits heavier.
    opacity.value = fadeIn * (poster ? 0.88 : 0.66);

    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    camera.position.x = pointer.x * 0.5;
    camera.position.y = 1.4 + pointer.y * 0.25;
    camera.lookAt(0, 1.1, 0);

    if (tree) tree.rotation.y += 0.0009;

    // init() is awaited above, so the synchronous render() is the supported path;
    // renderAsync() is deprecated as of three r185.
    renderer.render(scene, camera);
  }

  function onPointerMove(e) {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  }

  return {
    backend,
    count,
    /* The canvas outlives a theme toggle, so it has to follow one. Without this
       the leaves keep the palette they were born with and the hero looks broken
       the moment someone flips the switch. */
    applyTheme(name) {
      const next = THEME[name] ?? THEME[currentTheme()];
      colA.value.set(...new THREE.Color(next.leaf).toArray());
      colB.value.set(...new THREE.Color(next.leafAlt).toArray());
      const bark = new THREE.Color(next.bark);
      barkMaterials.forEach((m) => m.color.copy(bark));
      scene.children.forEach((c) => {
        if (c.isHemisphereLight) {
          c.color.set(next.key);
          c.groundColor.set(next.fill);
        } else if (c.isDirectionalLight) {
          c.color.set(next.key);
        }
      });
    },
    start() {
      if (running) return;
      running = true;
      resize();
      window.addEventListener("resize", resize);
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      frame();
    },
    stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
    },
    dispose() {
      this.stop();
      leafGeo.dispose();
      leafMat.dispose();
      barkMaterials.forEach((m) => m.dispose());
      tree?.traverse((o) => {
        if (o.isMesh) {
          o.geometry?.dispose();
          const m = o.material;
          Array.isArray(m) ? m.forEach((x) => x.dispose()) : m?.dispose();
        }
      });
      renderer.dispose();
    },
  };
}
