import * as THREE from 'three';
import { gsap } from 'gsap';

// Programmatically generate a white circular radial texture.
function createWhiteCircleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, 64, 64);
  
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.95)');
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.25)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  
  return new THREE.CanvasTexture(canvas);
}

// Generate static colorful circle textures for specific solid-colored objects
function createColoredCircleTexture(colorStr = '#38bdf8') {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 64, 64);
  
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, colorStr);
  gradient.addColorStop(0.35, colorStr + 'ee');
  gradient.addColorStop(0.75, colorStr + '44');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  
  return new THREE.CanvasTexture(canvas);
}

/* =========================================================================
   1. BACKGROUND PARTICLE CONSTELLATION SCENE
   ========================================================================= */
export function initBackgroundScene() {
  const canvas = document.getElementById('webgl-bg');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 120;

  // Particle Settings
  const particleCount = window.innerWidth < 768 ? 80 : 160;
  const areaRange = 250;
  const particlesPos = new Float32Array(particleCount * 3);
  const particleVelocities = [];

  // Generate random colors for background constellation
  const colors = [];
  const themeColors = [
    new THREE.Color('#38bdf8'), // Cyan
    new THREE.Color('#10b981'), // Emerald
    new THREE.Color('#8b5cf6'), // Purple
    new THREE.Color('#f97316'), // Orange
    new THREE.Color('#ec4899')  // Pink
  ];

  for (let i = 0; i < particleCount; i++) {
    particlesPos[i * 3] = (Math.random() - 0.5) * areaRange;
    particlesPos[i * 3 + 1] = (Math.random() - 0.5) * areaRange;
    particlesPos[i * 3 + 2] = (Math.random() - 0.5) * areaRange;

    particleVelocities.push({
      x: (Math.random() - 0.5) * 0.1,
      y: (Math.random() - 0.5) * 0.1,
      z: (Math.random() - 0.5) * 0.1
    });

    const color = themeColors[Math.floor(Math.random() * themeColors.length)];
    colors.push(color.r, color.g, color.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(particlesPos, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const whiteTex = createWhiteCircleTexture();
  const material = new THREE.PointsMaterial({
    size: 3.5,
    map: whiteTex,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
    opacity: 0.65
  });

  const particleSystem = new THREE.Points(geometry, material);
  scene.add(particleSystem);

  // Network Lines setup
  const maxConnections = particleCount * 2;
  const linePositions = new Float32Array(maxConnections * 2 * 3);
  const lineColors = new Float32Array(maxConnections * 2 * 3);

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

  const lineMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.18
  });

  const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(lineSegments);

  // Mouse interactivity variables
  let targetMouseX = 0;
  let targetMouseY = 0;
  let mouseX = 0;
  let mouseY = 0;

  window.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX - window.innerWidth / 2) * 0.05;
    targetMouseY = (e.clientY - window.innerHeight / 2) * 0.05;
  });

  let scrollProgress = 0;
  let targetScrollY = 0;
  
  window.addEventListener('scroll', () => {
    targetScrollY = window.scrollY;
  });

  const positionsAttr = geometry.attributes.position;
  const linePosAttr = lineGeometry.attributes.position;
  const lineColorAttr = lineGeometry.attributes.color;
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    clock.getDelta();

    for (let i = 0; i < particleCount; i++) {
      let x = positionsAttr.getX(i) + particleVelocities[i].x;
      let y = positionsAttr.getY(i) + particleVelocities[i].y;
      let z = positionsAttr.getZ(i) + particleVelocities[i].z;

      if (Math.abs(x) > areaRange / 2) particleVelocities[i].x *= -1;
      if (Math.abs(y) > areaRange / 2) particleVelocities[i].y *= -1;
      if (Math.abs(z) > areaRange / 2) particleVelocities[i].z *= -1;

      positionsAttr.setXYZ(i, x, y, z);
    }
    positionsAttr.needsUpdate = true;

    let lineIdx = 0;
    const connectionLimit = 35;

    for (let i = 0; i < particleCount; i++) {
      const x1 = positionsAttr.getX(i);
      const y1 = positionsAttr.getY(i);
      const z1 = positionsAttr.getZ(i);

      for (let j = i + 1; j < particleCount; j++) {
        const x2 = positionsAttr.getX(j);
        const y2 = positionsAttr.getY(j);
        const z2 = positionsAttr.getZ(j);

        const dx = x1 - x2;
        const dy = y1 - y2;
        const dz = z1 - z2;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < connectionLimit * connectionLimit) {
          linePosAttr.setXYZ(lineIdx, x1, y1, z1);
          linePosAttr.setXYZ(lineIdx + 1, x2, y2, z2);

          const r1 = colors[i * 3], g1 = colors[i * 3 + 1], b1 = colors[i * 3 + 2];
          const r2 = colors[j * 3], g2 = colors[j * 3 + 1], b2 = colors[j * 3 + 2];

          lineColorAttr.setXYZ(lineIdx, r1, g1, b1);
          lineColorAttr.setXYZ(lineIdx + 1, r2, g2, b2);

          lineIdx += 2;
          if (lineIdx >= maxConnections * 2) break;
        }
      }
      if (lineIdx >= maxConnections * 2) break;
    }
    
    for (let k = lineIdx; k < maxConnections * 2; k++) {
      linePosAttr.setXYZ(k, 0, 0, 0);
      lineColorAttr.setXYZ(k, 0, 0, 0);
    }
    linePosAttr.needsUpdate = true;
    lineColorAttr.needsUpdate = true;

    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const currentScrollProg = documentHeight > 0 ? targetScrollY / documentHeight : 0;
    scrollProgress += (currentScrollProg - scrollProgress) * 0.06;

    camera.position.x = mouseX;
    camera.position.y = -mouseY - (scrollProgress * 60);
    camera.position.z = 120 - (scrollProgress * 30);
    
    particleSystem.rotation.y = mouseX * 0.003 + scrollProgress * 0.5;
    particleSystem.rotation.x = mouseY * 0.003;
    lineSegments.rotation.y = mouseX * 0.003 + scrollProgress * 0.5;
    lineSegments.rotation.x = mouseY * 0.003;

    camera.lookAt(0, -scrollProgress * 60, 0);

    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  animate();
}

/* =========================================================================
   2. WORLD MAP CONTINENTS GENERATOR (High-Precision Equirectangular Mask)
   ========================================================================= */
function createWorldMapMaskCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 1024, 512);
  
  ctx.fillStyle = '#ffffff';

  // Helper to convert longitude (-180 to 180) and latitude (-90 to 90) to canvas (x, y)
  const mapPoint = (lon, lat) => {
    const x = ((lon + 180) / 360) * 1024;
    const y = ((90 - lat) / 180) * 512;
    return [x, y];
  };

  const drawPolygon = (coords) => {
    ctx.beginPath();
    const [startX, startY] = mapPoint(coords[0][0], coords[0][1]);
    ctx.moveTo(startX, startY);
    for (let i = 1; i < coords.length; i++) {
      const [x, y] = mapPoint(coords[i][0], coords[i][1]);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  };

  // 1. North America & Central America
  drawPolygon([
    [-168, 65], [-160, 71], [-130, 70], [-120, 76], [-80, 72], [-60, 60],
    [-65, 45], [-75, 35], [-80, 25], [-85, 20], [-78, 9], [-85, 12],
    [-92, 16], [-100, 20], [-106, 23], [-115, 30], [-124, 38], [-125, 49],
    [-135, 58], [-150, 60], [-165, 60]
  ]);

  // 2. Greenland
  drawPolygon([
    [-45, 83], [-20, 80], [-25, 70], [-40, 60], [-55, 65], [-58, 76]
  ]);

  // 3. South America
  drawPolygon([
    [-75, 10], [-60, 10], [-50, -2], [-35, -5], [-37, -12], [-42, -22],
    [-52, -32], [-65, -53], [-74, -50], [-72, -40], [-78, -15], [-81, -4],
    [-77, 6]
  ]);

  // 4. Europe & Scandinavia
  drawPolygon([
    [-9, 36], [0, 37], [15, 38], [25, 36], [30, 42], [40, 45],
    [32, 55], [30, 60], [28, 70], [18, 71], [10, 62], [5, 54],
    [-4, 48], [-9, 43]
  ]);
  // UK & Ireland
  drawPolygon([[-5, 50], [1, 52], [-2, 58], [-6, 56]]);
  drawPolygon([[-10, 51], [-6, 52], [-6, 55], [-10, 54]]);

  // 5. Africa & Madagascar
  drawPolygon([
    [-6, 35], [10, 37], [25, 32], [32, 30], [42, 12], [51, 11],
    [45, 0], [40, -10], [35, -25], [28, -34], [18, -34], [12, -20],
    [10, -5], [0, 5], [-17, 14], [-17, 22], [-10, 30]
  ]);
  // Madagascar
  drawPolygon([[44, -12], [50, -14], [47, -25], [43, -24]]);

  // 6. Asia (Middle East, Russia/Siberia, India, China, SE Asia)
  drawPolygon([
    [35, 30], [55, 25], [60, 22], [68, 24], [72, 18], [78, 8],
    [85, 20], [92, 22], [100, 10], [104, 1], [108, 12], [118, 22],
    [122, 30], [128, 38], [132, 43], [140, 55], [170, 65], [180, 68],
    [170, 73], [140, 75], [100, 76], [70, 70], [50, 65], [40, 50],
    [35, 40]
  ]);
  // Japan
  drawPolygon([[130, 32], [140, 36], [142, 44], [135, 35]]);
  // Indonesia & Philippines
  drawPolygon([[96, 4], [106, -6], [116, -8], [114, 0]]);
  drawPolygon([[118, 5], [125, 7], [126, 17], [120, 15]]);
  drawPolygon([[120, -2], [128, -2], [130, -8], [122, -8]]);

  // 7. Australia & New Zealand
  drawPolygon([
    [114, -22], [125, -15], [135, -12], [142, -10], [150, -23], [152, -32],
    [148, -38], [138, -35], [125, -34], [115, -34], [113, -28]
  ]);
  // New Zealand
  drawPolygon([[172, -35], [178, -38], [176, -42], [172, -40]]);
  drawPolygon([[168, -42], [172, -44], [170, -47], [166, -45]]);

  return canvas;
}

/* =========================================================================
   3. HERO INTERACTIVE 3D DIGITAL GLOBE (Matches Design Reference)
   ========================================================================= */
export function initHeroGlobe() {
  const container = document.getElementById('globe-canvas-container');
  if (!container) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = 21;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  // Main Parent Group for entire Globe assembly
  const globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // A. Atmospheric Radiant Back-Glow Halo
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = 128;
  haloCanvas.height = 128;
  const haloCtx = haloCanvas.getContext('2d');
  const haloGrad = haloCtx.createRadialGradient(64, 64, 20, 64, 64, 64);
  haloGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
  haloGrad.addColorStop(0.5, 'rgba(13, 148, 136, 0.2)');
  haloGrad.addColorStop(0.85, 'rgba(139, 92, 246, 0.08)');
  haloGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  haloCtx.fillStyle = haloGrad;
  haloCtx.fillRect(0, 0, 128, 128);

  const haloTex = new THREE.CanvasTexture(haloCanvas);
  const haloMat = new THREE.SpriteMaterial({ map: haloTex, transparent: true, opacity: 0.85 });
  const haloSprite = new THREE.Sprite(haloMat);
  haloSprite.scale.set(16, 16, 1);
  haloSprite.position.z = -1.5;
  scene.add(haloSprite);

  // B. Inner Translucent Atmosphere Sphere
  const innerSphereGeo = new THREE.SphereGeometry(6.0, 48, 48);
  const innerSphereMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.08,
    wireframe: false
  });
  const innerSphere = new THREE.Mesh(innerSphereGeo, innerSphereMat);
  globeGroup.add(innerSphere);

  // C. Atmosphere Rim Glow Ring
  const rimGeo = new THREE.RingGeometry(6.02, 6.12, 64);
  const rimMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6
  });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.lookAt(camera.position);
  scene.add(rimMesh);

  // D. Continental Dotted Map Point Cloud (Fibonacci Sphere + World Mask)
  const mapCanvas = createWorldMapMaskCanvas();
  const mapCtx = mapCanvas.getContext('2d');
  const mapImgData = mapCtx.getImageData(0, 0, 1024, 512).data;

  const totalSpherePoints = 14000;
  const globePositions = [];
  const globeColors = [];
  const globeSizes = [];

  const globeRadius = 6.18;
  const phiSpan = Math.PI * (3 - Math.sqrt(5)); // Golden angle

  const cCyan = new THREE.Color('#0284c7');    // Deep Cyan
  const cTeal = new THREE.Color('#0d9488');    // Teal / Emerald
  const cViolet = new THREE.Color('#8b5cf6');  // Violet Purple
  const cBright = new THREE.Color('#38bdf8');  // Bright Highlight

  for (let i = 0; i < totalSpherePoints; i++) {
    const y = 1 - (i / (totalSpherePoints - 1)) * 2; // y goes from 1 to -1
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phiSpan * i;

    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;

    // Convert (x, y, z) on unit sphere to UV coordinates on equirectangular map
    const lon = Math.atan2(x, z); // range [-PI, PI]
    const lat = Math.asin(y);     // range [-PI/2, PI/2]

    const u = (lon + Math.PI) / (2 * Math.PI);
    const v = (Math.PI / 2 - lat) / Math.PI;

    const pixelX = Math.floor(u * 1024);
    const pixelY = Math.floor(v * 512);
    const imgIndex = (pixelY * 1024 + pixelX) * 4;
    const isLand = mapImgData[imgIndex] > 60; // Red channel check on white continent

    if (isLand) {
      // Landmass dot - high density & bright vibrant color
      globePositions.push(x * globeRadius, y * globeRadius, z * globeRadius);

      const heightFactor = (y + 1) / 2; // 0 to 1
      let dotColor;
      if (Math.random() < 0.15) {
        dotColor = cBright;
      } else if (heightFactor > 0.6) {
        dotColor = new THREE.Color().lerpColors(cCyan, cViolet, (heightFactor - 0.6) / 0.4);
      } else {
        dotColor = new THREE.Color().lerpColors(cTeal, cCyan, heightFactor / 0.6);
      }

      globeColors.push(dotColor.r, dotColor.g, dotColor.b);
      globeSizes.push(0.18);
    } else {
      // Ocean dot - sparse subtle ambient grid
      if (Math.random() < 0.035) {
        globePositions.push(x * globeRadius, y * globeRadius, z * globeRadius);
        const oceanColor = new THREE.Color('#bae6fd');
        globeColors.push(oceanColor.r * 0.4, oceanColor.g * 0.4, oceanColor.b * 0.4);
        globeSizes.push(0.07);
      }
    }
  }

  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(globePositions, 3));
  dotGeo.setAttribute('color', new THREE.Float32BufferAttribute(globeColors, 3));

  const whiteCircleTex = createWhiteCircleTexture();
  const dotMat = new THREE.PointsMaterial({
    size: 0.22,
    map: whiteCircleTex,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
    opacity: 0.95
  });

  const globePoints = new THREE.Points(dotGeo, dotMat);
  globeGroup.add(globePoints);

  // E. Multi-Track Data Stream Orbit Rings (Teal Track + Purple Track)
  const ringGroup = new THREE.Group();
  globeGroup.add(ringGroup);

  // 1. Teal / Cyan Stream Orbit (Streamline Ribbon 1)
  const tealTrackGroup = new THREE.Group();
  ringGroup.add(tealTrackGroup);
  tealTrackGroup.rotation.x = Math.PI / 2.6;
  tealTrackGroup.rotation.y = -Math.PI / 6;

  const createConcentricStreamlines = (radii, colorHex, opacityVal, parentGroup) => {
    radii.forEach((r, idx) => {
      const curveSegments = 120;
      const points = [];
      for (let s = 0; s <= curveSegments; s++) {
        const theta = (s / curveSegments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * (r * 0.98), 0));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: opacityVal - idx * 0.08
      });
      const line = new THREE.Line(lineGeo, lineMat);
      parentGroup.add(line);
    });
  };

  createConcentricStreamlines([7.4, 7.55, 7.7, 7.85], 0x0d9488, 0.75, tealTrackGroup);

  // 2. Violet / Purple Stream Orbit (Streamline Ribbon 2)
  const purpleTrackGroup = new THREE.Group();
  ringGroup.add(purpleTrackGroup);
  purpleTrackGroup.rotation.x = -Math.PI / 2.8;
  purpleTrackGroup.rotation.y = Math.PI / 5;

  createConcentricStreamlines([7.7, 7.85, 8.0], 0x8b5cf6, 0.7, purpleTrackGroup);

  // 3. Equatorial High-Tech Circuit Line
  const eqPoints = [];
  for (let s = 0; s <= 100; s++) {
    const theta = (s / 100) * Math.PI * 2;
    eqPoints.push(new THREE.Vector3(Math.cos(theta) * 7.2, 0, Math.sin(theta) * 7.2));
  }
  const eqGeo = new THREE.BufferGeometry().setFromPoints(eqPoints);
  const eqMat = new THREE.LineDashedMaterial({
    color: 0x0284c7,
    dashSize: 0.6,
    gapSize: 0.3,
    transparent: true,
    opacity: 0.4
  });
  const eqLine = new THREE.Line(eqGeo, eqMat);
  eqLine.computeLineDistances();
  ringGroup.add(eqLine);

  // F. Glowing Stream Photon Packets / Satellites
  // Teal Orbit Satellites
  const tealSatGeo = new THREE.BufferGeometry();
  const tealSatPos = new Float32Array(4 * 3);
  tealSatGeo.setAttribute('position', new THREE.BufferAttribute(tealSatPos, 3));
  const tealSatMat = new THREE.PointsMaterial({
    size: 0.55,
    map: createColoredCircleTexture('#22d3ee'),
    transparent: true,
    opacity: 0.95
  });
  const tealSatellites = new THREE.Points(tealSatGeo, tealSatMat);
  tealTrackGroup.add(tealSatellites);

  // Purple Orbit Satellites
  const purpleSatGeo = new THREE.BufferGeometry();
  const purpleSatPos = new Float32Array(3 * 3);
  purpleSatGeo.setAttribute('position', new THREE.BufferAttribute(purpleSatPos, 3));
  const purpleSatMat = new THREE.PointsMaterial({
    size: 0.6,
    map: createColoredCircleTexture('#a855f7'),
    transparent: true,
    opacity: 0.95
  });
  const purpleSatellites = new THREE.Points(purpleSatGeo, purpleSatMat);
  purpleTrackGroup.add(purpleSatellites);

  // Drag & Touch Interaction Handlers
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let targetRotationY = 0.5;
  let targetRotationX = 0.15;

  const onPointerDown = (e) => {
    isDragging = true;
    previousMousePosition = {
      x: e.clientX || (e.touches && e.touches[0].clientX),
      y: e.clientY || (e.touches && e.touches[0].clientY)
    };
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    const deltaX = clientX - previousMousePosition.x;
    const deltaY = clientY - previousMousePosition.y;

    targetRotationY += deltaX * 0.005;
    targetRotationX += deltaY * 0.005;

    targetRotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, targetRotationX));

    previousMousePosition = { x: clientX, y: clientY };
  };

  const onPointerUp = () => {
    isDragging = false;
  };

  container.addEventListener('mousedown', onPointerDown);
  container.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  container.addEventListener('touchstart', onPointerDown, { passive: true });
  container.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  // Animation Loop
  let time = 0;
  const tealPosAttr = tealSatellites.geometry.attributes.position;
  const purplePosAttr = purpleSatellites.geometry.attributes.position;

  function renderGlobe() {
    requestAnimationFrame(renderGlobe);
    time += 0.01;

    // Auto rotate globe smoothly
    if (!isDragging) {
      targetRotationY += 0.0035;
    }

    globeGroup.rotation.y += (targetRotationY - globeGroup.rotation.y) * 0.05;
    globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.05;

    // Counter rotate streamline tracks gently for dynamic particle flow
    tealTrackGroup.rotation.z += 0.004;
    purpleTrackGroup.rotation.z -= 0.005;

    // Animate Teal Stream Photons
    const r1 = 7.55;
    tealPosAttr.setXYZ(0, Math.cos(time * 1.4) * r1, Math.sin(time * 1.4) * (r1 * 0.98), 0);
    tealPosAttr.setXYZ(1, Math.cos(time * 1.4 + Math.PI * 0.5) * (r1 + 0.15), Math.sin(time * 1.4 + Math.PI * 0.5) * ((r1 + 0.15) * 0.98), 0);
    tealPosAttr.setXYZ(2, Math.cos(time * 1.4 + Math.PI) * (r1 - 0.15), Math.sin(time * 1.4 + Math.PI) * ((r1 - 0.15) * 0.98), 0);
    tealPosAttr.setXYZ(3, Math.cos(time * 1.4 + Math.PI * 1.5) * (r1 + 0.3), Math.sin(time * 1.4 + Math.PI * 1.5) * ((r1 + 0.3) * 0.98), 0);
    tealPosAttr.needsUpdate = true;

    // Animate Purple Stream Photons
    const r2 = 7.85;
    purplePosAttr.setXYZ(0, Math.cos(time * 1.2) * r2, Math.sin(time * 1.2) * (r2 * 0.98), 0);
    purplePosAttr.setXYZ(1, Math.cos(time * 1.2 + Math.PI * 0.7) * (r2 + 0.15), Math.sin(time * 1.2 + Math.PI * 0.7) * ((r2 + 0.15) * 0.98), 0);
    purplePosAttr.setXYZ(2, Math.cos(time * 1.2 + Math.PI * 1.4) * (r2 - 0.15), Math.sin(time * 1.2 + Math.PI * 1.4) * ((r2 - 0.15) * 0.98), 0);
    purplePosAttr.needsUpdate = true;

    renderer.render(scene, camera);
  }

  // Handle Container Resizing
  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      if (w && h) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }
    }
  });
  resizeObserver.observe(container);

  renderGlobe();
}
