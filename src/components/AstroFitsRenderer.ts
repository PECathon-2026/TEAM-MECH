import { ImageEnhancementState, SamplePhoto } from '../types';

export interface AstroFieldBuffer {
  width: number;
  height: number;
  targetId: string;
  // Linear floating-point channels (0.0 to ~1.0+ dynamic range before stretch)
  nebulaR: Float32Array;
  nebulaG: Float32Array;
  nebulaB: Float32Array;
  hAlpha: Float32Array;
  oIII: Float32Array;
  sII: Float32Array;
  // Separate star layers for PSF deconvolution / star minimization
  starCoreR: Float32Array;
  starCoreG: Float32Array;
  starCoreB: Float32Array;
  starHaloR: Float32Array;
  starHaloG: Float32Array;
  starHaloB: Float32Array;
  // Sensor & optical artifacts present in Raw Linear frame
  vignetteMap: Float32Array; // cos^4(theta) falloff (0.42 at corners to 1.0 at center)
  skyglowR: Float32Array;
  skyglowG: Float32Array;
  skyglowB: Float32Array;
  readNoise: Float32Array; // Gaussian + Poisson noise seed (-1 to +1)
  hotPixels: Float32Array; // Sparse thermal dark-current spikes
}

export interface HistogramData {
  rawBins: number[]; // 48 bins normalized 0-100
  stretchedBinsR: number[];
  stretchedBinsG: number[];
  stretchedBinsB: number[];
  effectiveSnrDb: number;
  effectiveFwhmArcsec: number;
  rawMedianAdu: number;
  stretchedMedianAdu: number;
  dynamicRangeStops: number;
}

// Deterministic PRNG for reproducible astronomical starfields and fractal filaments
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fast 2D Value Noise + FBM for realistic interstellar dust & ionized gas filaments
function createNoise2D(seed: number) {
  const rng = mulberry32(seed);
  const perm = new Uint8Array(512);
  const grad = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    grad[i] = rng() * 2 - 1;
    perm[i] = i;
  }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = perm[i];
    perm[i] = perm[j];
    perm[j] = tmp;
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);

  const noise = (x: number, y: number): number => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = perm[perm[X] + Y];
    const ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y];
    const bb = perm[perm[X + 1] + Y + 1];
    return lerp(
      lerp(grad[aa], grad[ba], u),
      lerp(grad[ab], grad[bb], u),
      v
    );
  };

  const fbm = (x: number, y: number, octaves = 5): number => {
    let value = 0;
    let amp = 0.5;
    let freq = 1.0;
    for (let i = 0; i < octaves; i++) {
      value += amp * noise(x * freq, y * freq);
      freq *= 2.07;
      amp *= 0.48;
    }
    return value;
  };

  const ridgedFbm = (x: number, y: number, octaves = 4): number => {
    let value = 0;
    let amp = 0.5;
    let freq = 1.0;
    let weight = 1.0;
    for (let i = 0; i < octaves; i++) {
      let n = 1.0 - Math.abs(noise(x * freq, y * freq));
      n = n * n * weight;
      weight = Math.min(1.0, Math.max(0.0, n * 1.6));
      value += n * amp;
      freq *= 2.15;
      amp *= 0.45;
    }
    return value;
  };

  return { noise, fbm, ridgedFbm };
}

/**
 * Generates a scientifically accurate linear photon buffer for a deep-sky object
 */
export function buildScientificAstroBuffer(
  photo: SamplePhoto,
  width = 640,
  height = 480
): AstroFieldBuffer {
  const size = width * height;
  const nebulaR = new Float32Array(size);
  const nebulaG = new Float32Array(size);
  const nebulaB = new Float32Array(size);
  const hAlpha = new Float32Array(size);
  const oIII = new Float32Array(size);
  const sII = new Float32Array(size);

  const starCoreR = new Float32Array(size);
  const starCoreG = new Float32Array(size);
  const starCoreB = new Float32Array(size);
  const starHaloR = new Float32Array(size);
  const starHaloG = new Float32Array(size);
  const starHaloB = new Float32Array(size);

  const vignetteMap = new Float32Array(size);
  const skyglowR = new Float32Array(size);
  const skyglowG = new Float32Array(size);
  const skyglowB = new Float32Array(size);
  const readNoise = new Float32Array(size);
  const hotPixels = new Float32Array(size);

  const seedMap: Record<string, number> = {
    'photo-andromeda': 310224,
    'photo-orion': 421976,
    'photo-pleiades': 451435,
    'photo-veil': 699233,
  };
  const seed = seedMap[photo.id] || 777123;
  const rng = mulberry32(seed);
  const { fbm, ridgedFbm } = createNoise2D(seed + 19);

  // 1. Precompute optical vignetting (cos^4 off-axis illumination drop), skyglow gradient, and sensor noise
  for (let y = 0; y < height; y++) {
    const ny = (y / height) * 2 - 1;
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * 2 - 1;
      const idx = y * width + x;

      // Optical vignetting: cos^4(theta) model
      const r2 = (nx * nx * 1.1 + ny * ny * 0.95) * 0.44;
      const cosTheta = 1 / Math.sqrt(1 + r2);
      vignetteMap[idx] = Math.pow(cosTheta, 3.6); // ~0.46 in extreme corners, 1.0 in center

      // Uncalibrated skyglow + RGGB Bayer green-warm bias gradient (stronger toward bottom-right horizon)
      const gradFactor = 0.55 + 0.45 * ((x / width) * 0.65 + (y / height) * 0.75);
      skyglowR[idx] = 0.032 * gradFactor;
      skyglowG[idx] = 0.046 * gradFactor; // Typical uncalibrated CMOS green Bayer cast + airglow 557.7nm
      skyglowB[idx] = 0.029 * gradFactor;

      // Box-Muller Gaussian read noise
      const u1 = Math.max(1e-6, rng());
      const u2 = rng();
      const gauss = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      readNoise[idx] = gauss;

      // Sparse thermal dark-current hot pixels (0.14% of pixels)
      const hpRoll = rng();
      if (hpRoll > 0.9986) {
        hotPixels[idx] = 0.55 + rng() * 0.45;
      }
    }
  }

  // 2. Synthesize Deep-Sky Nebulosity / Galactic Structure per Target Category
  const cx = width * 0.5;
  const cy = height * 0.5;

  if (photo.objectCategory === 'galaxy') {
    // M31 — Andromeda Spiral Galaxy (inclined 77 deg, PA ~38 deg, plus M32 and M110)
    const angle = -0.58; // radians (~-33 deg diagonal across frame)
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const inclination = 3.15; // foreshortening along minor axis

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const dx = (x - cx) / (width * 0.45);
        const dy = (y - cy) / (height * 0.45);

        // Rotate into galactic disk plane
        const gx = dx * cosA - dy * sinA;
        const gy = (dx * sinA + dy * cosA) * inclination;
        const rDisk = Math.sqrt(gx * gx + gy * gy);
        const theta = Math.atan2(gy, gx);

        // Sersic n=4 bulge + exponential disk
        const rBulge = Math.sqrt(gx * gx * 1.1 + (gy / 1.45) * (gy / 1.45));
        const bulge = 1.65 * Math.exp(-3.9 * Math.pow(rBulge + 0.012, 0.52));

        // 2-arm logarithmic spiral + tightly wound dust rings
        const turb = fbm(gx * 4.5 + 3.1, gy * 4.5 + 1.7, 4) * 0.35;
        const spiralPhase = Math.cos(2 * theta - 7.8 * Math.log(rDisk + 0.08) + turb * 2.2);
        const ringPhase = Math.cos(16.0 * rDisk + turb * 3.5);

        const armEnvelope = Math.exp(-rDisk * 1.85) * Math.max(0, 1 - Math.exp(-rDisk * 6.5));
        const spiralArm = armEnvelope * (0.55 + 0.45 * spiralPhase) * (0.75 + 0.25 * ringPhase);

        // Interstellar dark dust absorption lanes (stronger on near side of disk: gy > 0)
        const nearSideBias = gy > -0.1 ? Math.min(1.3, 0.5 + (gy + 0.15) * 1.6) : 0.35;
        const dustFbm = ridgedFbm(gx * 6.2 + Math.cos(theta), gy * 6.2 + Math.sin(theta), 4);
        const dustLane =
          nearSideBias *
          armEnvelope *
          Math.max(0, -ringPhase * 0.65 + 0.35) *
          (0.45 + 0.55 * dustFbm);
        const extinction = Math.exp(-dustLane * 2.75);

        // H-Alpha star-forming knots along spiral arms (656.3nm)
        const knotNoise = Math.max(0, ridgedFbm(gx * 11.5, gy * 11.5, 3) - 0.62);
        const haKnots = armEnvelope * Math.max(0, spiralPhase) * knotNoise * 1.85;

        // Satellite Galaxy M32 (compact elliptical at 41%, 68%)
        const dxM32 = (x - width * 0.41) / (width * 0.065);
        const dyM32 = (y - height * 0.68) / (height * 0.065);
        const rM32 = Math.sqrt(dxM32 * dxM32 + dyM32 * dyM32);
        const m32Signal = 0.85 * Math.exp(-3.4 * Math.pow(rM32 + 0.04, 0.65));

        // Satellite Galaxy M110 (diffuse dwarf elliptical at 63%, 25%)
        const dxM110 = (x - width * 0.63) / (width * 0.11);
        const dyM110 = (y - height * 0.25) / (height * 0.08);
        const m110RotX = dxM110 * 0.8 - dyM110 * 0.6;
        const m110RotY = (dxM110 * 0.6 + dyM110 * 0.8) * 1.65;
        const rM110 = Math.sqrt(m110RotX * m110RotX + m110RotY * m110RotY);
        const m110Signal = 0.36 * Math.exp(-2.3 * Math.pow(rM110 + 0.05, 0.8));

        // Combine spectral populations:
        // Bulge & M32: warm golden-white Pop II stars
        // Spiral arms: hot blue-white OB associations + pink H-alpha regions
        const totalBulge = (bulge + m32Signal) * (0.4 + 0.6 * extinction);
        const totalDisk = spiralArm * extinction;

        const rVal = totalBulge * 1.05 + totalDisk * 0.42 + haKnots * 1.15 + m110Signal * 0.72;
        const gVal = totalBulge * 0.84 + totalDisk * 0.58 + haKnots * 0.18 + m110Signal * 0.68;
        const bVal = totalBulge * 0.56 + totalDisk * 0.96 + haKnots * 0.38 + m110Signal * 0.64;

        nebulaR[idx] = rVal;
        nebulaG[idx] = gVal;
        nebulaB[idx] = bVal;
        hAlpha[idx] = haKnots + totalBulge * 0.38 + totalDisk * 0.25;
        oIII[idx] = totalDisk * 0.62 + totalBulge * 0.25;
        sII[idx] = haKnots * 0.55 + totalBulge * 0.18;
      }
    }
  } else if (photo.objectCategory === 'emission_nebula') {
    // M42 — Great Orion Nebula (Huygens O-III core, sweeping H-alpha wings, Orion Bar, M43)
    const trapX = width * 0.48;
    const trapY = height * 0.52;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const dx = (x - trapX) / (width * 0.38);
        const dy = (y - trapY) / (height * 0.38);
        const r = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        const f1 = fbm(dx * 3.2 + 1.4, dy * 3.2 - 0.8, 5);
        const r1 = ridgedFbm(dx * 4.0 + f1 * 0.5, dy * 4.0 + f1 * 0.5, 4);

        // Bright Huygens core (strong O-III 500.7nm + H-alpha)
        const core = 1.75 * Math.exp(-4.2 * Math.pow(r + 0.03, 0.75)) * (0.7 + 0.3 * r1);

        // Sweeping parabolic bow wings of M42 cavity
        const wingAngle1 = Math.exp(-Math.pow(angle - 0.55, 2) * 1.4);
        const wingAngle2 = Math.exp(-Math.pow(angle + 1.85, 2) * 1.3);
        const cavityShell =
          Math.exp(-Math.pow(r - 0.52, 2) * 5.2) * (wingAngle1 + wingAngle2 * 0.9) * (0.5 + 0.7 * r1);

        // Orion Bar ionization shock front (SE ridge)
        const barProj = dx * 0.72 + dy * 0.69 - 0.28;
        const barAlong = -dx * 0.69 + dy * 0.72;
        const orionBar =
          0.75 *
          Math.exp(-barProj * barProj * 65.0) *
          Math.exp(-barAlong * barAlong * 6.0) *
          (0.65 + 0.35 * r1);

        // De Mairan's Nebula M43 (North comma-shaped H II region at 46%, 28%)
        const dxM43 = (x - width * 0.46) / (width * 0.09);
        const dyM43 = (y - height * 0.28) / (height * 0.09);
        const rM43 = Math.sqrt(dxM43 * dxM43 + dyM43 * dyM43);
        const m43 = 0.68 * Math.exp(-2.6 * rM43 * rM43) * (0.65 + 0.35 * f1);

        // Fish Mouth dark dust bay indenting the NE core
        const bayDx = dx - 0.14;
        const bayDy = dy + 0.11;
        const bayDist = Math.sqrt(bayDx * bayDx * 2.2 + bayDy * bayDy * 6.5);
        const darkBayExtinction = 1.0 - 0.78 * Math.exp(-bayDist * bayDist * 14.0);

        // Outer faint molecular hydrogen loop
        const outerVeil = 0.32 * Math.exp(-r * 1.35) * Math.max(0, r1 - 0.25);

        const haSignal = (core * 0.95 + cavityShell * 1.15 + orionBar * 0.9 + m43 * 1.05 + outerVeil) * darkBayExtinction;
        const oiiiSignal = (core * 1.15 + cavityShell * 0.42 + orionBar * 0.35 + m43 * 0.22) * darkBayExtinction;
        const siiSignal = (orionBar * 1.1 + cavityShell * 0.68 + outerVeil * 0.8 + m43 * 0.5) * darkBayExtinction;

        hAlpha[idx] = haSignal;
        oIII[idx] = oiiiSignal;
        sII[idx] = siiSignal;

        // Broadband L-RGB natural emission appearance (ruby H-alpha + teal O-III + violet H-beta)
        nebulaR[idx] = haSignal * 0.92 + siiSignal * 0.25 + core * 0.25;
        nebulaG[idx] = oiiiSignal * 0.78 + haSignal * 0.18 + core * 0.32;
        nebulaB[idx] = oiiiSignal * 0.92 + haSignal * 0.36 + core * 0.38;
      }
    }
  } else if (photo.objectCategory === 'reflection_cluster') {
    // M45 — Pleiades Reflection Nebula (Seven Sisters + filamentary blue dust striations)
    const sevenSisters = [
      { x: 0.47, y: 0.51, lum: 1.6 }, // Alcyone
      { x: 0.29, y: 0.53, lum: 1.3 }, // Atlas
      { x: 0.29, y: 0.46, lum: 1.05 }, // Pleione
      { x: 0.58, y: 0.68, lum: 1.4 }, // Merope
      { x: 0.64, y: 0.34, lum: 1.35 }, // Maia
      { x: 0.72, y: 0.48, lum: 1.38 }, // Electra
      { x: 0.69, y: 0.27, lum: 1.15 }, // Taygeta
    ];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const nx = x / width;
        const ny = y / height;

        // Directional brushed dust striations (parallel filaments oriented at ~28 degrees)
        const rotU = nx * 0.88 + ny * 0.47;
        const rotV = -nx * 0.47 + ny * 0.88;
        const striations = ridgedFbm(rotU * 14.0, rotV * 3.2, 4);
        const cloudFbm = fbm(nx * 4.5 + 2.0, ny * 4.5 + 1.0, 4);

        let dustIllum = 0;
        for (const s of sevenSisters) {
          const dx = (nx - s.x) * 1.33;
          const dy = ny - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          dustIllum += s.lum * 0.28 * Math.exp(-dist * 4.2);
        }

        const reflectionIntensity = dustIllum * (0.35 + 0.65 * striations) * (0.65 + 0.35 * cloudFbm);
        // Faint brownish IFN (Integrated Flux Nebula) dust on periphery
        const ifn = Math.max(0, cloudFbm + 0.15) * 0.08 * Math.exp(-dustIllum * 1.5);

        // Rayleigh/Mie scattering strongly favors 440-480nm blue wavelengths
        nebulaR[idx] = reflectionIntensity * 0.22 + ifn * 0.55;
        nebulaG[idx] = reflectionIntensity * 0.58 + ifn * 0.45;
        nebulaB[idx] = reflectionIntensity * 1.18 + ifn * 0.35;

        hAlpha[idx] = reflectionIntensity * 0.2 + ifn * 0.6;
        oIII[idx] = reflectionIntensity * 1.1;
        sII[idx] = ifn * 0.5 + reflectionIntensity * 0.15;
      }
    }
  } else {
    // NGC 6992 — Eastern Veil Supernova Remnant (Filamentary shock arc in Cygnus)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const nx = (x / width) * 2 - 1;
        const ny = (y / height) * 2 - 1;

        // Curved supernova blast wave arc across frame
        const arcX = nx + 0.18 * ny * ny - 0.05;
        const warp1 = fbm(nx * 4.2 + 0.7, ny * 4.2 - 1.2, 5);
        const braidOIII = ridgedFbm((arcX + warp1 * 0.16) * 8.5, ny * 3.8 + warp1, 4);
        const braidHa = ridgedFbm((arcX - 0.06 + warp1 * 0.18) * 7.8, ny * 3.6 - warp1 * 0.8, 4);

        const envOIII = Math.exp(-Math.pow(arcX + 0.06, 2) * 18.0) * Math.exp(-ny * ny * 1.2);
        const envHa = Math.exp(-Math.pow(arcX - 0.05, 2) * 14.0) * Math.exp(-ny * ny * 1.1);

        const oiiiVal = envOIII * Math.pow(Math.max(0, braidOIII - 0.18), 1.6) * 1.65;
        const haVal = envHa * Math.pow(Math.max(0, braidHa - 0.15), 1.5) * 1.55;
        const siiVal = haVal * 0.65 + oiiiVal * 0.2;

        hAlpha[idx] = haVal;
        oIII[idx] = oiiiVal;
        sII[idx] = siiVal;

        nebulaR[idx] = haVal * 1.05 + siiVal * 0.25;
        nebulaG[idx] = oiiiVal * 0.88 + haVal * 0.12;
        nebulaB[idx] = oiiiVal * 1.02 + haVal * 0.18;
      }
    }
  }

  // 3. Populate Scientifically Registered Field Stars (Moffat PSF Core + Seeing Halo + Diffraction Spikes)
  interface StarDef {
    x: number;
    y: number;
    flux: number;
    r: number;
    g: number;
    b: number;
    spikes?: boolean;
  }

  const stars: StarDef[] = [];

  // Target-specific landmark stars
  if (photo.objectCategory === 'reflection_cluster') {
    const pleiadesStars = [
      { x: 0.47, y: 0.51, flux: 3.4, spikes: true }, // Alcyone
      { x: 0.29, y: 0.53, flux: 2.8, spikes: true }, // Atlas
      { x: 0.29, y: 0.46, flux: 2.1, spikes: true }, // Pleione
      { x: 0.58, y: 0.68, flux: 2.9, spikes: true }, // Merope
      { x: 0.64, y: 0.34, flux: 2.8, spikes: true }, // Maia
      { x: 0.72, y: 0.48, flux: 2.9, spikes: true }, // Electra
      { x: 0.69, y: 0.27, flux: 2.4, spikes: true }, // Taygeta
      { x: 0.73, y: 0.39, flux: 1.7, spikes: false }, // Celaeno
      { x: 0.62, y: 0.24, flux: 1.5, spikes: false }, // Asterope
    ];
    for (const ps of pleiadesStars) {
      stars.push({
        x: ps.x * width,
        y: ps.y * height,
        flux: ps.flux,
        r: 0.72,
        g: 0.88,
        b: 1.0,
        spikes: ps.spikes,
      });
    }
  } else if (photo.objectCategory === 'emission_nebula') {
    // Trapezium Cluster theta-1 Orionis A, B, C, D
    const tx = width * 0.48;
    const ty = height * 0.52;
    stars.push(
      { x: tx - 4, y: ty - 3, flux: 2.8, r: 0.8, g: 0.92, b: 1.0, spikes: true },
      { x: tx + 5, y: ty - 2, flux: 2.3, r: 0.82, g: 0.94, b: 1.0 },
      { x: tx + 2, y: ty + 5, flux: 3.2, r: 0.78, g: 0.9, b: 1.0, spikes: true },
      { x: tx - 3, y: ty + 4, flux: 2.1, r: 0.85, g: 0.92, b: 1.0 }
    );
  }

  // Generate 240 background Milky Way field stars with realistic Planck blackbody colors (O/B blue to K/M orange-red)
  const starCount = photo.objectCategory === 'supernova_remnant' ? 320 : 220;
  for (let i = 0; i < starCount; i++) {
    const sx = rng() * width;
    const sy = rng() * height;
    const magRoll = Math.pow(rng(), 3.2);
    const flux = 0.18 + magRoll * 2.1;
    const tempRoll = rng();
    let sr = 1.0,
      sg = 0.95,
      sb = 0.9;
    if (tempRoll < 0.25) {
      // Hot B/A star
      sr = 0.74;
      sg = 0.87;
      sb = 1.0;
    } else if (tempRoll < 0.65) {
      // Solar F/G star
      sr = 1.0;
      sg = 0.96;
      sb = 0.86;
    } else {
      // Cool K/M giant star
      sr = 1.0;
      sg = 0.76;
      sb = 0.52;
    }
    stars.push({
      x: sx,
      y: sy,
      flux,
      r: sr,
      g: sg,
      b: sb,
      spikes: flux > 1.85,
    });
  }

  // Stamp each star's tight Airy/Moffat core and outer seeing halo separately
  // so PSF deconvolution / star minimization can scientifically shrink FWHM!
  for (const s of stars) {
    const radius = s.spikes ? 26 : Math.ceil(6 + s.flux * 5);
    const minX = Math.max(0, Math.floor(s.x - radius));
    const maxX = Math.min(width - 1, Math.ceil(s.x + radius));
    const minY = Math.max(0, Math.floor(s.y - radius));
    const maxY = Math.min(height - 1, Math.ceil(s.y + radius));

    const coreSigma2 = 1.15 + s.flux * 0.35;
    const haloSigma2 = 6.5 + s.flux * 5.2;

    for (let y = minY; y <= maxY; y++) {
      const dy = y - s.y;
      for (let x = minX; x <= maxX; x++) {
        const dx = x - s.x;
        const d2 = dx * dx + dy * dy;
        const idx = y * width + x;

        // Tight Moffat core
        const coreProfile = s.flux * Math.pow(1 + d2 / coreSigma2, -2.8);
        // Atmospheric seeing halo
        let haloProfile = s.flux * 0.42 * Math.pow(1 + d2 / haloSigma2, -1.65);

        // 4-vane spider diffraction spikes for bright stars
        if (s.spikes) {
          const spikeX = Math.exp(-Math.abs(dy) * 1.35) * Math.exp(-Math.abs(dx) * 0.085);
          const spikeY = Math.exp(-Math.abs(dx) * 1.35) * Math.exp(-Math.abs(dy) * 0.085);
          haloProfile += s.flux * 0.55 * (spikeX + spikeY);
        }

        starCoreR[idx] += coreProfile * s.r;
        starCoreG[idx] += coreProfile * s.g;
        starCoreB[idx] += coreProfile * s.b;

        starHaloR[idx] += haloProfile * s.r;
        starHaloG[idx] += haloProfile * s.g;
        starHaloB[idx] += haloProfile * s.b;
      }
    }
  }

  return {
    width,
    height,
    targetId: photo.id,
    nebulaR,
    nebulaG,
    nebulaB,
    hAlpha,
    oIII,
    sII,
    starCoreR,
    starCoreG,
    starCoreB,
    starHaloR,
    starHaloG,
    starHaloB,
    vignetteMap,
    skyglowR,
    skyglowG,
    skyglowB,
    readNoise,
    hotPixels,
  };
}

/**
 * Converts a user-uploaded image into a scientific AstroFieldBuffer so even custom uploads
 * get true Raw Linear vs Stretched & Calibrated physics!
 */
export function buildBufferFromCustomImage(
  img: HTMLImageElement,
  width = 640,
  height = 480
): AstroFieldBuffer {
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height).data;

  const size = width * height;
  const nebulaR = new Float32Array(size);
  const nebulaG = new Float32Array(size);
  const nebulaB = new Float32Array(size);
  const hAlpha = new Float32Array(size);
  const oIII = new Float32Array(size);
  const sII = new Float32Array(size);
  const starCoreR = new Float32Array(size);
  const starCoreG = new Float32Array(size);
  const starCoreB = new Float32Array(size);
  const starHaloR = new Float32Array(size);
  const starHaloG = new Float32Array(size);
  const starHaloB = new Float32Array(size);
  const vignetteMap = new Float32Array(size);
  const skyglowR = new Float32Array(size);
  const skyglowG = new Float32Array(size);
  const skyglowB = new Float32Array(size);
  const readNoise = new Float32Array(size);
  const hotPixels = new Float32Array(size);

  const rng = mulberry32(90909);

  for (let y = 0; y < height; y++) {
    const ny = (y / height) * 2 - 1;
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * 2 - 1;
      const idx = y * width + x;
      const p = idx * 4;

      // Inverse sRGB to linear photon space
      const sr = Math.pow(imgData[p] / 255, 2.2);
      const sg = Math.pow(imgData[p + 1] / 255, 2.2);
      const sb = Math.pow(imgData[p + 2] / 255, 2.2);

      const lum = 0.299 * sr + 0.587 * sg + 0.114 * sb;
      const isStar = lum > 0.62 ? (lum - 0.62) / 0.38 : 0;

      nebulaR[idx] = sr * (1 - isStar * 0.6);
      nebulaG[idx] = sg * (1 - isStar * 0.6);
      nebulaB[idx] = sb * (1 - isStar * 0.6);

      hAlpha[idx] = sr * 1.1;
      oIII[idx] = (sg * 0.55 + sb * 0.45) * 1.1;
      sII[idx] = (sr * 0.8 + sg * 0.2);

      starCoreR[idx] = sr * isStar * 1.4;
      starCoreG[idx] = sg * isStar * 1.4;
      starCoreB[idx] = sb * isStar * 1.4;

      starHaloR[idx] = sr * isStar * 0.7;
      starHaloG[idx] = sg * isStar * 0.7;
      starHaloB[idx] = sb * isStar * 0.7;

      const r2 = (nx * nx + ny * ny) * 0.42;
      vignetteMap[idx] = Math.pow(1 / Math.sqrt(1 + r2), 3.4);

      const grad = 0.5 + 0.5 * ((x / width) * 0.6 + (y / height) * 0.7);
      skyglowR[idx] = 0.028 * grad;
      skyglowG[idx] = 0.042 * grad;
      skyglowB[idx] = 0.025 * grad;

      const u1 = Math.max(1e-6, rng());
      const u2 = rng();
      readNoise[idx] = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      if (rng() > 0.9987) hotPixels[idx] = 0.6 + rng() * 0.4;
    }
  }

  return {
    width,
    height,
    targetId: 'custom',
    nebulaR,
    nebulaG,
    nebulaB,
    hAlpha,
    oIII,
    sII,
    starCoreR,
    starCoreG,
    starCoreB,
    starHaloR,
    starHaloG,
    starHaloB,
    vignetteMap,
    skyglowR,
    skyglowG,
    skyglowB,
    readNoise,
    hotPixels,
  };
}

/**
 * Renders both the RAW 16-Bit Linear Sub-Frame and the Scientifically Calibrated & Stretched Master Frame
 * onto two pixel-aligned canvases, and returns real-time ADU histogram & SNR metrics.
 */
export function processAstroFrames(
  buffer: AstroFieldBuffer,
  settings: ImageEnhancementState,
  rawCanvas: HTMLCanvasElement,
  enhancedCanvas: HTMLCanvasElement
): HistogramData {
  const { width, height } = buffer;
  if (rawCanvas.width !== width) rawCanvas.width = width;
  if (rawCanvas.height !== height) rawCanvas.height = height;
  if (enhancedCanvas.width !== width) enhancedCanvas.width = width;
  if (enhancedCanvas.height !== height) enhancedCanvas.height = height;

  const rawCtx = rawCanvas.getContext('2d')!;
  const enhCtx = enhancedCanvas.getContext('2d')!;

  const rawImg = rawCtx.createImageData(width, height);
  const enhImg = enhCtx.createImageData(width, height);
  const rawData = rawImg.data;
  const enhData = enhImg.data;

  const numBins = 48;
  const rawBins = new Array(numBins).fill(0);
  const stretchedBinsR = new Array(numBins).fill(0);
  const stretchedBinsG = new Array(numBins).fill(0);
  const stretchedBinsB = new Array(numBins).fill(0);

  // Scientific processing parameters derived from controls
  // 1. Arcsinh non-linear stretch factor alpha (1.2 at 0% -> 85 at 100%)
  const stretchAlpha = 1.2 + Math.pow(settings.stretching / 100, 1.85) * 78.0;
  const asinhNorm = Math.asinh(stretchAlpha);

  // 2. Flat-Field & Dynamic Background Extraction (0% = uncalibrated vignetting + skyglow, 100% = full calibration)
  const flatCalib = settings.flatCalibration / 100;

  // 3. Wavelet & Sigma-Clip Denoising (0% = raw sensor noise + hot pixels, 100% = ultra-clean stack)
  const denoiseFactor = 1.0 - (settings.noiseReduction / 100) * 0.92;
  const hotPixelReject = settings.noiseReduction > 22 ? 0 : 1.0 - settings.noiseReduction / 22;

  // 4. PSF Deconvolution & Star Minimization (0% = bloated seeing halo, 100% = razor-sharp minimized stars)
  const starHaloFactor = Math.max(0.08, 1.0 - (settings.starMinimization / 100) * 0.88);
  const starCoreFactor = Math.max(0.42, 1.0 - (settings.starMinimization / 100) * 0.45);

  // 5. Saturation & Color Temp
  const satBoost = 0.55 + (settings.saturation / 100) * 1.15;
  const tempOffset = (settings.colorTemp - 5500) / 5000; // -0.5 (cool) to +0.5 (warm)
  const rWb = 1.0 + tempOffset * 0.24;
  const bWb = 1.0 - tempOffset * 0.24;

  const size = width * height;
  let sumStretchedLum = 0;

  for (let i = 0; i < size; i++) {
    const p = i * 4;
    const vig = buffer.vignetteMap[i];
    const noise = buffer.readNoise[i];
    const hp = buffer.hotPixels[i];

    // =========================================================
    // A. RAW 16-BIT LINEAR SUB-FRAME SIMULATION (Right Side)
    // =========================================================
    // In a linear sub-exposure, faint nebulosity is compressed near the bottom 3-7% of dynamic range,
    // modulated by optical vignetting, additive skyglow, read noise, and hot pixels.
    const rawNebFactor = 0.085; // Linear unstretched nebulosity scale
    const rawStarCore = 0.85;
    const rawStarHalo = 0.95; // Un-deconvolved bloated PSF in raw frame

    let rawR =
      (buffer.nebulaR[i] * rawNebFactor +
        buffer.starCoreR[i] * rawStarCore +
        buffer.starHaloR[i] * rawStarHalo) *
        vig +
      buffer.skyglowR[i] +
      noise * 0.026 +
      hp * 0.75;
    let rawG =
      (buffer.nebulaG[i] * rawNebFactor +
        buffer.starCoreG[i] * rawStarCore +
        buffer.starHaloG[i] * rawStarHalo) *
        vig +
      buffer.skyglowG[i] +
      noise * 0.028 +
      hp * 0.25;
    let rawB =
      (buffer.nebulaB[i] * rawNebFactor +
        buffer.starCoreB[i] * rawStarCore +
        buffer.starHaloB[i] * rawStarHalo) *
        vig +
      buffer.skyglowB[i] +
      noise * 0.026 +
      hp * 0.55;

    rawR = Math.max(0, Math.min(1, rawR));
    rawG = Math.max(0, Math.min(1, rawG));
    rawB = Math.max(0, Math.min(1, rawB));

    rawData[p] = Math.round(rawR * 255);
    rawData[p + 1] = Math.round(rawG * 255);
    rawData[p + 2] = Math.round(rawB * 255);
    rawData[p + 3] = 255;

    const rawLum = 0.299 * rawR + 0.587 * rawG + 0.114 * rawB;
    const rawBinIdx = Math.min(numBins - 1, Math.floor(Math.pow(rawLum, 0.55) * numBins));
    rawBins[rawBinIdx]++;

    // =========================================================
    // B. SCIENTIFICALLY CALIBRATED & STRETCHED MASTER (Left Side)
    // =========================================================
    // 1. Select spectral bandpass channel mapping
    let sigR = buffer.nebulaR[i];
    let sigG = buffer.nebulaG[i];
    let sigB = buffer.nebulaB[i];

    if (settings.bandpassMode === 'hoo') {
      // H-Alpha -> Red, O-III -> Teal (Green + Blue)
      sigR = buffer.hAlpha[i] * 1.15;
      sigG = buffer.oIII[i] * 0.88 + buffer.hAlpha[i] * 0.12;
      sigB = buffer.oIII[i] * 1.05 + buffer.hAlpha[i] * 0.16;
    } else if (settings.bandpassMode === 'sho') {
      // Hubble Palette: S-II -> Red, H-Alpha -> Green/Gold, O-III -> Blue
      sigR = buffer.sII[i] * 1.15 + buffer.hAlpha[i] * 0.35;
      sigG = buffer.hAlpha[i] * 0.92 + buffer.oIII[i] * 0.22;
      sigB = buffer.oIII[i] * 1.25;
    } else if (settings.bandpassMode === 'halpha') {
      // Monochromatic 656.28nm Hydrogen-Alpha Narrowband
      const ha = buffer.hAlpha[i] * 1.15;
      sigR = ha;
      sigG = ha;
      sigB = ha;
    }

    // 2. Apply Master Flat-Field calibration & Dynamic Background Extraction (DBE)
    // If flatCalib < 1, residual vignetting and skyglow remain and get stretched!
    const effectiveVig = vig + (1.0 - vig) * flatCalib;
    const residualSkyR = buffer.skyglowR[i] * (1.0 - flatCalib);
    const residualSkyG = buffer.skyglowG[i] * (1.0 - flatCalib);
    const residualSkyB = buffer.skyglowB[i] * (1.0 - flatCalib);

    // 3. Apply Arcsinh(alpha * I) / Arcsinh(alpha) Non-Linear Stretch to nebulosity
    const linR = Math.max(0, sigR * effectiveVig + residualSkyR);
    const linG = Math.max(0, sigG * effectiveVig + residualSkyG);
    const linB = Math.max(0, sigB * effectiveVig + residualSkyB);

    // Color-preserving Arcsinh stretch (stretches luminance by asinh, preserving chromatic ratios)
    const linLum = Math.max(1e-5, 0.299 * linR + 0.587 * linG + 0.114 * linB);
    const stretchedLum = Math.asinh(stretchAlpha * linLum) / asinhNorm;
    const stretchRatio = stretchedLum / linLum;

    let stR = linR * stretchRatio;
    let stG = linG * stretchRatio;
    let stB = linB * stretchRatio;

    // 4. Add Deconvolved Stars (tightened FWHM core + minimized seeing halo)
    const sR = buffer.starCoreR[i] * starCoreFactor + buffer.starHaloR[i] * starHaloFactor;
    const sG = buffer.starCoreG[i] * starCoreFactor + buffer.starHaloG[i] * starHaloFactor;
    const sB = buffer.starCoreB[i] * starCoreFactor + buffer.starHaloB[i] * starHaloFactor;

    // HDR Soft-Knee Combination so stars & core don't hard-clip
    stR = 1.0 - Math.exp(-(stR + sR));
    stG = 1.0 - Math.exp(-(stG + sG));
    stB = 1.0 - Math.exp(-(stB + sB));

    // 5. Add residual sensor noise & unrejected hot pixels based on Wavelet Noise Reduction slider
    const resNoise = noise * 0.032 * denoiseFactor;
    const resHp = hp * hotPixelReject;
    stR += resNoise + resHp * 0.7;
    stG += resNoise + resHp * 0.2;
    stB += resNoise + resHp * 0.5;

    // 6. Spectrophotometric Color Calibration (White Balance + Saturation)
    if (settings.bandpassMode !== 'halpha' && settings.bandpassMode !== 'inverted') {
      stR *= rWb;
      stB *= bWb;
      const lum = 0.299 * stR + 0.587 * stG + 0.114 * stB;
      stR = lum + (stR - lum) * satBoost;
      stG = lum + (stG - lum) * satBoost;
      stB = lum + (stB - lum) * satBoost;
    }

    // Dark-sky pedestal (astronomical background reference ~14/255)
    const pedestal = 0.035;
    stR = pedestal + stR * (1 - pedestal);
    stG = pedestal + stG * (1 - pedestal);
    stB = pedestal + stB * (1 - pedestal);

    // 7. Inverted Luminance Inspection Plate mode
    if (settings.bandpassMode === 'inverted') {
      const invLum = 1.0 - Math.min(1, Math.max(0, 0.299 * stR + 0.587 * stG + 0.114 * stB));
      stR = invLum * 0.96;
      stG = invLum * 0.97;
      stB = invLum;
    }

    stR = Math.max(0, Math.min(1, stR));
    stG = Math.max(0, Math.min(1, stG));
    stB = Math.max(0, Math.min(1, stB));

    enhData[p] = Math.round(stR * 255);
    enhData[p + 1] = Math.round(stG * 255);
    enhData[p + 2] = Math.round(stB * 255);
    enhData[p + 3] = 255;

    sumStretchedLum += 0.299 * stR + 0.587 * stG + 0.114 * stB;

    stretchedBinsR[Math.min(numBins - 1, Math.floor(stR * numBins))]++;
    stretchedBinsG[Math.min(numBins - 1, Math.floor(stG * numBins))]++;
    stretchedBinsB[Math.min(numBins - 1, Math.floor(stB * numBins))]++;
  }

  rawCtx.putImageData(rawImg, 0, 0);
  enhCtx.putImageData(enhImg, 0, 0);

  // Normalize histogram bins (0 to 100) using log-damped scaling for realistic astro histogram display
  const normalizeBins = (bins: number[]) => {
    const logBins = bins.map((v) => (v > 0 ? Math.log10(v + 1) : 0));
    const maxVal = Math.max(1e-5, ...logBins);
    return logBins.map((v) => Math.round((v / maxVal) * 100));
  };

  // Compute scientific telemetry metrics
  const effectiveSnrDb = Number(
    (
      11.2 +
      (settings.noiseReduction / 100) * 16.5 +
      (settings.flatCalibration / 100) * 4.8 +
      Math.min(4.0, (settings.stretching / 100) * 3.5)
    ).toFixed(1)
  );
  const effectiveFwhmArcsec = Number(
    (2.95 - (settings.starMinimization / 100) * 1.48).toFixed(2)
  );
  const rawMedianAdu = 860;
  const stretchedMedianAdu = Math.round((sumStretchedLum / size) * 65535);
  const dynamicRangeStops = Number((8.4 + (settings.stretching / 100) * 5.8).toFixed(1));

  return {
    rawBins: normalizeBins(rawBins),
    stretchedBinsR: normalizeBins(stretchedBinsR),
    stretchedBinsG: normalizeBins(stretchedBinsG),
    stretchedBinsB: normalizeBins(stretchedBinsB),
    effectiveSnrDb,
    effectiveFwhmArcsec,
    rawMedianAdu,
    stretchedMedianAdu,
    dynamicRangeStops,
  };
}
