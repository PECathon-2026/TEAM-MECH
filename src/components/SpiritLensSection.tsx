import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SectionHeading } from './SectionHeading';
import { SAMPLE_PHOTOS } from '../data/astronomyData';
import { SamplePhoto, ImageEnhancementState, SpectralBandpassMode } from '../types';
import {
  buildScientificAstroBuffer,
  buildBufferFromCustomImage,
  processAstroFrames,
  AstroFieldBuffer,
  HistogramData,
} from './AstroFitsRenderer';
import {
  Sliders,
  Upload,
  RefreshCw,
  Layers,
  Zap,
  Crosshair,
  Eye,
  Activity,
  Compass,
  Sparkles,
  RotateCcw,
  Download,
  Info,
} from 'lucide-react';

type ViewportMode = 'split' | 'calibrated' | 'raw' | 'blink';

const BANDPASS_MODES: { id: SpectralBandpassMode; label: string; badge: string; desc: string }[] = [
  {
    id: 'lrgb',
    label: 'L-RGB BROADBAND',
    badge: '400–700nm',
    desc: 'Spectrophotometrically calibrated true-color continuum (SPCC)',
  },
  {
    id: 'hoo',
    label: 'HOO DUAL-BAND',
    badge: 'Ha + OIII',
    desc: 'Bi-color narrowband mapping: Hα (656.3nm) → Red, [O III] (500.7nm) → Teal',
  },
  {
    id: 'sho',
    label: 'SHO HUBBLE',
    badge: 'SII / Ha / OIII',
    desc: 'Hubble Space Telescope narrowband palette: [S II] → R, Hα → G, [O III] → B',
  },
  {
    id: 'halpha',
    label: 'H-ALPHA MONO',
    badge: '656.28nm',
    desc: 'Pure 3nm Hydrogen-Alpha Balmer emission line monochromatic isolator',
  },
  {
    id: 'inverted',
    label: 'INVERTED PLATE',
    badge: 'NEG LUM',
    desc: 'Observatory negative luminance plate for inspecting ultra-faint outer tidal halos',
  },
];

export const SpiritLensSection: React.FC = () => {
  const [selectedPhoto, setSelectedPhoto] = useState<SamplePhoto>(SAMPLE_PHOTOS[0]);
  const [sliderPosition, setSliderPosition] = useState<number>(58);
  const [viewportMode, setViewportMode] = useState<ViewportMode>('split');
  const [blinkShowRaw, setBlinkShowRaw] = useState<boolean>(false);
  const [showWcsOverlay, setShowWcsOverlay] = useState<boolean>(true);
  const [showScientificNotes, setShowScientificNotes] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [customImageElement, setCustomImageElement] = useState<HTMLImageElement | null>(null);

  const [settings, setSettings] = useState<ImageEnhancementState>({
    stretching: 72,
    flatCalibration: 95,
    noiseReduction: 78,
    starMinimization: 45,
    colorTemp: 5500,
    saturation: 65,
    bandpassMode: 'lrgb',
  });

  const [histogram, setHistogram] = useState<HistogramData | null>(null);

  // Interactive cursor photometry inspector state
  const [cursorInspect, setCursorInspect] = useState<{
    active: boolean;
    xPct: number;
    yPct: number;
    rawAdu: number;
    stretchedAdu: number;
    vignettePct: number;
    raOffset: string;
    decOffset: string;
  } | null>(null);

  const rawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const enhancedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportContainerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const [aiResult, setAiResult] = useState<any>({
    analysis:
      'Astrometric Plate-Solve converged (0.34″ RMS). Raw 16-bit linear frame exhibits expected low-ADU photon compression (median 842 ADU) with cos⁴θ optical vignetting and thermal dark-current spikes. Applying Arcsinh non-linear stretch + Master Flat/DBE reveals outer spiral dust lanes and 656.28nm H II regions.',
    detectedObjects: SAMPLE_PHOTOS[0].detectedObjects,
    spectralData: {
      hAlpha: SAMPLE_PHOTOS[0].spectralMetrics.hAlphaNm,
      oIII: SAMPLE_PHOTOS[0].spectralMetrics.oIIINm,
      sII: SAMPLE_PHOTOS[0].spectralMetrics.sIINm,
      signalToNoiseRatio: '31.4 dB',
    },
  });

  // Build linear floating-point photon buffer whenever preset or custom image changes
  const astroBuffer: AstroFieldBuffer = useMemo(() => {
    if (customImageElement && selectedPhoto.objectCategory === 'custom') {
      return buildBufferFromCustomImage(customImageElement, 640, 480);
    }
    return buildScientificAstroBuffer(selectedPhoto, 640, 480);
  }, [selectedPhoto, customImageElement]);

  // Re-run scientific FITS/RAW signal processor whenever buffer or sliders change
  useEffect(() => {
    if (!rawCanvasRef.current || !enhancedCanvasRef.current) return;
    const hist = processAstroFrames(
      astroBuffer,
      settings,
      rawCanvasRef.current,
      enhancedCanvasRef.current
    );
    setHistogram(hist);
  }, [astroBuffer, settings]);

  // Blink Comparator timer when in 'blink' mode
  useEffect(() => {
    if (viewportMode !== 'blink') {
      setBlinkShowRaw(false);
      return;
    }
    const timer = window.setInterval(() => {
      setBlinkShowRaw((prev) => !prev);
    }, 950);
    return () => window.clearInterval(timer);
  }, [viewportMode]);

  // Handle pointer dragging for split curtain
  const updatePositionFromClientX = (clientX: number) => {
    if (!viewportContainerRef.current) return;
    const rect = viewportContainerRef.current.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setSliderPosition(Math.round(relX * 100));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!viewportContainerRef.current) return;
    const rect = viewportContainerRef.current.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (isDraggingRef.current && viewportMode === 'split') {
      setSliderPosition(Math.round(relX * 100));
    }

    // Sample live pixel photometry from both canvases
    if (rawCanvasRef.current && enhancedCanvasRef.current) {
      const px = Math.min(
        astroBuffer.width - 1,
        Math.max(0, Math.floor(relX * astroBuffer.width))
      );
      const py = Math.min(
        astroBuffer.height - 1,
        Math.max(0, Math.floor(relY * astroBuffer.height))
      );
      const idx = py * astroBuffer.width + px;

      const rawCtx = rawCanvasRef.current.getContext('2d');
      const enhCtx = enhancedCanvasRef.current.getContext('2d');
      if (rawCtx && enhCtx) {
        const rPx = rawCtx.getImageData(px, py, 1, 1).data;
        const ePx = enhCtx.getImageData(px, py, 1, 1).data;
        const rawLum = (0.299 * rPx[0] + 0.587 * rPx[1] + 0.114 * rPx[2]) / 255;
        const enhLum = (0.299 * ePx[0] + 0.587 * ePx[1] + 0.114 * ePx[2]) / 255;

        const vigPct = Math.round(astroBuffer.vignetteMap[idx] * 100);
        const dRaArcmin = ((relX - 0.5) * -120).toFixed(1);
        const dDecArcmin = ((0.5 - relY) * 90).toFixed(1);

        setCursorInspect({
          active: true,
          xPct: Math.round(relX * 100),
          yPct: Math.round(relY * 100),
          rawAdu: Math.round(rawLum * 65535),
          stretchedAdu: Math.round(enhLum * 65535),
          vignettePct: vigPct,
          raOffset: `${Number(dRaArcmin) >= 0 ? '+' : ''}${dRaArcmin}′`,
          decOffset: `${Number(dDecArcmin) >= 0 ? '+' : ''}${dDecArcmin}′`,
        });
      }
    }
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        const img = new Image();
        img.onload = () => {
          setCustomImageElement(img);
          const customSample: SamplePhoto = {
            id: 'custom-' + Date.now(),
            title: file.name.replace(/\.[^/.]+$/, ''),
            targetName: `User FITS/RAW Capture (${file.name.replace(/\.[^/.]+$/, '')})`,
            catalogId: 'USER-FIELD',
            objectCategory: 'custom',
            originalUrl: resultStr,
            enhancedUrl: resultStr,
            exposureTime: 'User Integration Frame',
            subFrameInfo: 'Inverse-Gamma Linearized Raw vs Arcsinh Calibrated Master',
            equipment: 'Custom Optical Tube & Sensor',
            sensorSpecs: '16-Bit Linearized Photometric Buffer',
            bortleSky: 'User Site Calibration',
            raCenter: '00h 00m 00.0s',
            decCenter: '+00° 00′ 00″',
            fieldOfView: 'Custom Plate Scale',
            spectralMetrics: {
              hAlphaNm: '656.28 nm (Extracted Red Channel Balmer Proxy)',
              oIIINm: '500.68 nm (Extracted Teal Continuum Proxy)',
              sIINm: '671.64 nm (Sulfur-II Proxy)',
              rawMedianAdu: 920,
              stretchedMedianAdu: 15400,
              baseSnrDb: 12.0,
              rawFwhmArcsec: 2.85,
            },
            detectedObjects: [
              {
                name: 'Primary Field Centroid',
                confidence: 0.96,
                type: 'Plate-Solved Target',
                coordinates: 'Field Center (0.0′, 0.0′)',
                xPercent: 50,
                yPercent: 50,
                angularSize: 'Primary ROI',
              },
            ],
          };
          setSelectedPhoto(customSample);
          runAiAnalysis(resultStr, customSample);
        };
        img.src = resultStr;
      };
      reader.readAsDataURL(file);
    }
  };

  const runAiAnalysis = async (imageBase64?: string, photoRef?: SamplePhoto) => {
    const activePhoto = photoRef || selectedPhoto;
    setIsAnalyzing(true);
    try {
      // Capture current calibrated master canvas as base64 JPEG for real Gemini Vision analysis
      const canvasBase64 =
        imageBase64 ||
        (enhancedCanvasRef.current
          ? enhancedCanvasRef.current.toDataURL('image/jpeg', 0.85)
          : null);

      const response = await fetch('/api/spirit-lens/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: canvasBase64,
          customPrompt: `Analyze this calibrated astronomical frame of ${activePhoto.targetName} (${activePhoto.catalogId}). Describe its spectral emission lines (H-Alpha 656.28nm, O-III 500.68nm, S-II 671.6nm), signal-to-noise calibration, and deep-space morphology. Return strict JSON with 'analysis', 'detectedObjects' (array of {name, confidence, type, coordinates}), and 'spectralData' ({hAlpha, oIII, sII, signalToNoiseRatio}).`,
        }),
      });
      const data = await response.json();
      if (data && data.analysis) {
        // Preserve xPercent/yPercent coordinates if matching preset objects
        const mergedObjects =
          data.detectedObjects?.map((obj: any, i: number) => ({
            ...obj,
            xPercent: activePhoto.detectedObjects[i]?.xPercent ?? 35 + i * 18,
            yPercent: activePhoto.detectedObjects[i]?.yPercent ?? 40 + (i % 2) * 20,
            angularSize: activePhoto.detectedObjects[i]?.angularSize ?? 'Resolved',
          })) || activePhoto.detectedObjects;

        setAiResult({
          ...data,
          detectedObjects: mergedObjects,
        });
      }
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePhotoSelect = (photo: SamplePhoto) => {
    setSelectedPhoto(photo);
    setCustomImageElement(null);
    setAiResult({
      analysis: `Astrometric Plate-Solve converged on ${photo.targetName} (${photo.catalogId}). Raw linear sub-frame shows unstretched linear photon response (median ${photo.spectralMetrics.rawMedianAdu} ADU) with cos⁴θ optical vignetting and skyglow gradient. Master calibration applies Flat-Field division, Dynamic Background Extraction (DBE), and Arcsinh non-linear transformation.`,
      detectedObjects: photo.detectedObjects,
      spectralData: {
        hAlpha: photo.spectralMetrics.hAlphaNm,
        oIII: photo.spectralMetrics.oIIINm,
        sII: photo.spectralMetrics.sIINm,
        signalToNoiseRatio: `${(photo.spectralMetrics.baseSnrDb + 18.5).toFixed(1)} dB`,
      },
    });
  };

  const resetToOptimalCalibration = () => {
    setSettings({
      stretching: 72,
      flatCalibration: 95,
      noiseReduction: 78,
      starMinimization: 45,
      colorTemp: 5500,
      saturation: 65,
      bandpassMode: 'lrgb',
    });
  };

  const simulateUncalibratedStretch = () => {
    // Shows what happens if you stretch a raw frame WITHOUT flat-fielding or denoising
    setSettings({
      stretching: 78,
      flatCalibration: 0,
      noiseReduction: 0,
      starMinimization: 0,
      colorTemp: 5500,
      saturation: 55,
      bandpassMode: 'lrgb',
    });
  };

  const handleExportMasterPng = () => {
    if (!enhancedCanvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${selectedPhoto.catalogId.replace(/\s+/g, '_')}_Calibrated_Master.png`;
    link.href = enhancedCanvasRef.current.toDataURL('image/png');
    link.click();
  };

  // Compute effective clip percentage based on viewport mode
  const effectiveClipPercent =
    viewportMode === 'split'
      ? sliderPosition
      : viewportMode === 'calibrated'
      ? 100
      : viewportMode === 'raw'
      ? 0
      : blinkShowRaw
      ? 0
      : 100;

  return (
    <section id="spirit-lens" className="py-16 md:py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <SectionHeading
          title="SPIRIT LENS"
          kanjiTitle="霊眼"
          subtitle="Scientific 16-bit FITS/RAW astrophotography calibration pipeline: compare linear sensor sub-exposures against flat-fielded, Arcsinh-stretched, and PSF-deconvolved master integrations."
          symbol="✦"
        />

        {/* Deep-Sky Target Selector + Upload Bar */}
        <div className="mb-6 p-4 rounded-3xl bg-[#172238] border border-[#D6AD60]/25 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-[#D6AD60] uppercase mr-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>FITS TELEMETRY TARGETS:</span>
            </span>

            {SAMPLE_PHOTOS.map((photo) => {
              const isSelected = selectedPhoto.id === photo.id;
              return (
                <button
                  key={photo.id}
                  onClick={() => handlePhotoSelect(photo)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#10182A] text-[#F3F0E8] border border-[#D6AD60] shadow-[0_0_14px_rgba(214,173,96,0.25)]'
                      : 'text-[#A7B2C5] hover:text-[#F3F0E8] bg-[#10182A]/50 border border-transparent hover:border-[#D6AD60]/30'
                  }`}
                >
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#D6AD60]/15 text-[#D6AD60]">
                    {photo.catalogId.split('·')[0].trim()}
                  </span>
                  <span>{photo.title.split('—')[1]?.trim() || photo.title}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowScientificNotes((prev) => !prev)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-mono border transition-all flex items-center gap-1.5 cursor-pointer ${
                showScientificNotes
                  ? 'bg-[#D6AD60]/20 text-[#F3F0E8] border-[#D6AD60]'
                  : 'bg-[#10182A] text-[#A7B2C5] border-[#D6AD60]/30 hover:text-[#F3F0E8]'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-[#D6AD60]" />
              <span>WHY RAW LOOKS DARK</span>
            </button>

            <button
              onClick={handleExportMasterPng}
              className="px-3.5 py-2.5 rounded-xl bg-[#10182A] text-[#D6AD60] border border-[#D6AD60]/30 text-xs font-mono hover:bg-[#D6AD60]/15 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Export calibrated master integration as PNG"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT MASTER</span>
            </button>

            <label className="px-4 py-2.5 rounded-xl bg-[#D6AD60] text-[#080D1A] font-bold text-xs hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>LOAD CUSTOM FRAME</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCustomUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Collapsible Scientific Explanation Drawer */}
        {showScientificNotes && (
          <div className="mb-6 p-5 rounded-2xl bg-[#10182A]/95 border border-[#D6AD60]/40 text-xs leading-relaxed grid grid-cols-1 md:grid-cols-3 gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="font-mono text-[#D6AD60] font-bold uppercase flex items-center gap-1.5">
                <span>1. Linear Photon Response (γ = 1.0)</span>
              </div>
              <p className="text-[#A7B2C5]">
                In a true 16-bit astronomical RAW/FITS sub-exposure, sensor ADU values scale linearly with photon count. Because deep-sky nebulae have surface brightnesses below 21 mag/arcsec², 95% of nebula signal sits compressed in the lowest 2–5% of the histogram (800–1,400 ADU out of 65,535), making raw frames appear nearly black except for bright stellar cores.
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-mono text-[#D6AD60] font-bold uppercase flex items-center gap-1.5">
                <span>2. Master Calibration (Dark / Flat / DBE)</span>
              </div>
              <p className="text-[#A7B2C5]">
                Raw frames suffer from off-axis optical vignetting (cos⁴θ illumination drop-off in corners), atmospheric airglow/light-pollution gradients, RGGB Bayer green bias, and thermal dark-current hot pixels. Dividing by a Master Flat and applying Dynamic Background Extraction (DBE) isolates true cosmic signal before stretching.
              </p>
            </div>
            <div className="space-y-1">
              <div className="font-mono text-[#D6AD60] font-bold uppercase flex items-center gap-1.5">
                <span>3. Arcsinh Stretch & PSF Deconvolution</span>
              </div>
              <p className="text-[#A7B2C5]">
                Applying an inverse hyperbolic sine transform I&#x2092;&#x1D64;&#x209C; = asinh(α·I)/asinh(α) amplifies faint low-ADU dust and Hα/OIII filaments by up to 50× while preserving high-dynamic-range galactic cores (M31/Trapezium) without clipping. Richardson-Lucy PSF deconvolution tightens stellar FWHM blurred by atmospheric seeing.
              </p>
            </div>
          </div>
        )}

        {/* Main Observatory Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 Columns: Pixel-Aligned Dual-Buffer FITS Viewport + Live Histogram */}
          <div className="lg:col-span-7 space-y-4">
            {/* Viewport Mode & WCS Overlay Toolbar */}
            <div className="p-3 rounded-2xl bg-[#172238] border border-[#D6AD60]/20 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'split', label: 'SPLIT CURTAIN' },
                    { id: 'calibrated', label: 'CALIBRATED MASTER' },
                    { id: 'raw', label: 'RAW 16-BIT LINEAR' },
                    { id: 'blink', label: 'BLINK COMPARATOR' },
                  ] as { id: ViewportMode; label: string }[]
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setViewportMode(m.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                      viewportMode === m.id
                        ? 'bg-[#D6AD60] text-[#080D1A] font-bold'
                        : 'bg-[#10182A] text-[#A7B2C5] hover:text-[#F3F0E8] border border-[#D6AD60]/20'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowWcsOverlay((prev) => !prev)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
                  showWcsOverlay
                    ? 'bg-[#10182A] text-[#D6AD60] border-[#D6AD60]'
                    : 'bg-[#10182A]/50 text-[#A7B2C5] border-transparent hover:border-[#D6AD60]/30'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>WCS PLATE-SOLVE {showWcsOverlay ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Dual-Canvas Astrometric Comparison Stage */}
            <div
              ref={viewportContainerRef}
              onPointerDown={(e) => {
                if (viewportMode === 'split') {
                  isDraggingRef.current = true;
                  updatePositionFromClientX(e.clientX);
                }
              }}
              onPointerMove={handlePointerMove}
              onPointerUp={() => {
                isDraggingRef.current = false;
              }}
              onPointerLeave={() => {
                isDraggingRef.current = false;
                setCursorInspect(null);
              }}
              className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border-2 border-[#D6AD60]/40 shadow-2xl bg-[#050811] select-none cursor-crosshair"
            >
              {/* Layer 1 (Base): True 16-Bit Linear Unstretched RAW Sub-Frame */}
              <canvas
                ref={rawCanvasRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />

              {/* Layer 2 (Clipped Overlay): Scientifically Calibrated & Stretched Master Frame
                  Uses CSS clipPath inset() so the canvas NEVER squishes or distorts horizontally! */}
              <canvas
                ref={enhancedCanvasRef}
                style={{
                  clipPath: `inset(0 ${100 - effectiveClipPercent}% 0 0)`,
                }}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />

              {/* Layer 3: Astrometric WCS Equatorial Coordinate Grid & Target Reticles */}
              {showWcsOverlay && (
                <div className="absolute inset-0 pointer-events-none z-10">
                  <svg className="w-full h-full" viewBox="0 0 640 480" preserveAspectRatio="none">
                    <defs>
                      <pattern
                        id="wcs-grid"
                        width="128"
                        height="96"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 128 0 L 0 0 0 96"
                          fill="none"
                          stroke="rgba(214, 173, 96, 0.16)"
                          strokeWidth="0.75"
                          strokeDasharray="4 4"
                        />
                      </pattern>
                    </defs>
                    <rect width="640" height="480" fill="url(#wcs-grid)" />

                    {/* Equatorial Center Crosshair */}
                    <line
                      x1="312"
                      y1="240"
                      x2="328"
                      y2="240"
                      stroke="rgba(214, 173, 96, 0.45)"
                      strokeWidth="1"
                    />
                    <line
                      x1="320"
                      y1="232"
                      x2="320"
                      y2="248"
                      stroke="rgba(214, 173, 96, 0.45)"
                      strokeWidth="1"
                    />
                  </svg>

                  {/* Plate-Solved Object Reticles */}
                  {aiResult.detectedObjects?.map((obj: any, idx: number) => {
                    const xPct = obj.xPercent ?? 50;
                    const yPct = obj.yPercent ?? 50;
                    return (
                      <div
                        key={idx}
                        style={{ left: `${xPct}%`, top: `${yPct}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                      >
                        <div className="w-7 h-7 rounded-full border border-[#D6AD60]/80 bg-[#080D1A]/30 flex items-center justify-center shadow-[0_0_10px_rgba(214,173,96,0.35)]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#D6AD60]" />
                        </div>
                        <div className="mt-1 px-2 py-0.5 rounded bg-[#080D1A]/85 border border-[#D6AD60]/40 text-[9px] font-mono text-[#F3F0E8] whitespace-nowrap shadow">
                          <span className="text-[#D6AD60] font-bold mr-1">[{idx + 1}]</span>
                          {obj.name.split('(')[0].trim()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Split Curtain Divider Bar & Handle (only in Split mode) */}
              {viewportMode === 'split' && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-[#D6AD60] cursor-ew-resize z-20 shadow-[0_0_12px_#D6AD60]"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#080D1A] border-2 border-[#D6AD60] flex items-center justify-center text-[#D6AD60] shadow-lg">
                    <span className="text-[10px] font-mono font-bold tracking-tighter">◄│►</span>
                  </div>
                </div>
              )}

              {/* Top-Left Badge: Calibrated & Stretched State */}
              {effectiveClipPercent > 8 && (
                <div className="absolute top-3.5 left-3.5 z-20 pointer-events-none px-3 py-1.5 rounded-xl bg-[#080D1A]/85 backdrop-blur-md border border-[#D6AD60]/50 text-[11px] font-mono">
                  <div className="text-[#D6AD60] font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>CALIBRATED &amp; ARCSINH STRETCHED</span>
                  </div>
                  <div className="text-[10px] text-[#A7B2C5]">
                    {BANDPASS_MODES.find((b) => b.id === settings.bandpassMode)?.label} · Stretch +
                    {settings.stretching}% · Flat {settings.flatCalibration}%
                  </div>
                </div>
              )}

              {/* Top-Right Badge: Raw Linear Sub-Exposure State */}
              {effectiveClipPercent < 92 && (
                <div className="absolute top-3.5 right-3.5 z-20 pointer-events-none px-3 py-1.5 rounded-xl bg-[#080D1A]/85 backdrop-blur-md border border-[#A7B2C5]/40 text-[11px] font-mono text-right">
                  <div className="text-[#F3F0E8] font-bold flex items-center justify-end gap-1.5">
                    <span>RAW 16-BIT LINEAR FITS (γ = 1.0)</span>
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  </div>
                  <div className="text-[10px] text-[#A7B2C5]">
                    Unstretched ADU · cos⁴θ Vignetting · Read Noise + Hot Pixels
                  </div>
                </div>
              )}

              {/* Bottom Live Cursor Photometry Inspector Bar */}
              <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none px-3.5 py-2 rounded-xl bg-[#080D1A]/90 backdrop-blur-md border border-[#D6AD60]/30 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                <div className="flex items-center gap-2 text-[#D6AD60]">
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>
                    {cursorInspect
                      ? `ΔRA ${cursorInspect.raOffset} · ΔDec ${cursorInspect.decOffset} (X:${cursorInspect.xPct}% Y:${cursorInspect.yPct}%)`
                      : `J2000 ${selectedPhoto.raCenter} · ${selectedPhoto.decCenter} (Hover to inspect pixel ADU)`}
                  </span>
                </div>

                {cursorInspect ? (
                  <div className="flex items-center gap-4 text-[10px]">
                    <span>
                      RAW ADU:{' '}
                      <strong className="text-amber-300">{cursorInspect.rawAdu}</strong>/65535
                    </span>
                    <span>
                      STRETCHED ADU:{' '}
                      <strong className="text-emerald-400">{cursorInspect.stretchedAdu}</strong>
                      /65535
                    </span>
                    <span>
                      FLAT FIELD:{' '}
                      <strong className="text-[#F3F0E8]">{cursorInspect.vignettePct}%</strong>
                    </span>
                  </div>
                ) : (
                  <div className="text-[10px] text-[#A7B2C5]">
                    {selectedPhoto.subFrameInfo}
                  </div>
                )}
              </div>
            </div>

            {/* Scientific ADU Histogram & Telemetry Comparison Card */}
            {histogram && (
              <div className="p-4 rounded-2xl bg-[#172238] border border-[#D6AD60]/25 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D6AD60]/15 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#D6AD60]">
                    <Activity className="w-4 h-4" />
                    <span>REAL-TIME 16-BIT ADU HISTOGRAM &amp; PHOTOMETRIC TELEMETRY</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-mono">
                    <span className="text-[#A7B2C5]">
                      SNR:{' '}
                      <strong className="text-emerald-400">{histogram.effectiveSnrDb} dB</strong>
                    </span>
                    <span className="text-[#A7B2C5]">
                      STELLAR FWHM:{' '}
                      <strong className="text-[#D6AD60]">
                        {histogram.effectiveFwhmArcsec}″
                      </strong>
                    </span>
                    <span className="text-[#A7B2C5]">
                      DYNAMIC RANGE:{' '}
                      <strong className="text-[#F3F0E8]">
                        {histogram.dynamicRangeStops} stops
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Dual Histogram SVG: Raw Linear Spike vs Stretched RGB Curve */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Raw Linear Histogram */}
                  <div className="p-3 rounded-xl bg-[#10182A] border border-[#A7B2C5]/20">
                    <div className="flex justify-between text-[10px] font-mono mb-1.5">
                      <span className="text-amber-300 font-bold">
                        RAW LINEAR HISTOGRAM (UNSTRETCHED)
                      </span>
                      <span className="text-[#A7B2C5]">
                        Median: {selectedPhoto.spectralMetrics.rawMedianAdu} ADU
                      </span>
                    </div>
                    <svg className="w-full h-14 overflow-visible" viewBox="0 0 240 50">
                      {histogram.rawBins.map((val, i) => {
                        const x = i * 5;
                        const h = (val / 100) * 46;
                        return (
                          <rect
                            key={i}
                            x={x}
                            y={48 - h}
                            width="3.8"
                            height={Math.max(1, h)}
                            fill={i < 6 ? '#F59E0B' : 'rgba(167, 178, 197, 0.45)'}
                            rx="1"
                          />
                        );
                      })}
                    </svg>
                    <div className="flex justify-between text-[9px] font-mono text-[#A7B2C5]/70 mt-1">
                      <span>0 ADU (95% Signal Compressed in Left Spike)</span>
                      <span>65,535 ADU</span>
                    </div>
                  </div>

                  {/* Calibrated & Stretched Master RGB Histogram */}
                  <div className="p-3 rounded-xl bg-[#10182A] border border-[#D6AD60]/30">
                    <div className="flex justify-between text-[10px] font-mono mb-1.5">
                      <span className="text-emerald-400 font-bold">
                        ARCSINH STRETCHED RGB HISTOGRAM
                      </span>
                      <span className="text-[#D6AD60]">
                        Median: {histogram.stretchedMedianAdu.toLocaleString()} ADU
                      </span>
                    </div>
                    <svg className="w-full h-14 overflow-visible" viewBox="0 0 240 50">
                      {histogram.stretchedBinsR.map((rVal, i) => {
                        const gVal = histogram.stretchedBinsG[i];
                        const bVal = histogram.stretchedBinsB[i];
                        const x = i * 5;
                        const hr = (rVal / 100) * 46;
                        const hg = (gVal / 100) * 46;
                        const hb = (bVal / 100) * 46;
                        return (
                          <g key={i}>
                            <rect
                              x={x}
                              y={48 - hr}
                              width="3.8"
                              height={Math.max(1, hr)}
                              fill="rgba(244, 63, 94, 0.55)"
                            />
                            <rect
                              x={x}
                              y={48 - hg}
                              width="3.8"
                              height={Math.max(1, hg)}
                              fill="rgba(16, 185, 129, 0.55)"
                            />
                            <rect
                              x={x}
                              y={48 - hb}
                              width="3.8"
                              height={Math.max(1, hb)}
                              fill="rgba(56, 189, 248, 0.55)"
                            />
                          </g>
                        );
                      })}
                    </svg>
                    <div className="flex justify-between text-[9px] font-mono text-[#A7B2C5]/70 mt-1">
                      <span>Black Point Pedestal</span>
                      <span>Nebula Midtones Expanded</span>
                      <span>HDR Core</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Astrograph & Sensor Metadata Footer */}
            <div className="p-4 rounded-2xl bg-[#172238] border border-[#D6AD60]/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <span className="text-[#A7B2C5] text-[10px] block">INTEGRATION:</span>
                <span className="text-[#D6AD60] font-bold">{selectedPhoto.exposureTime}</span>
              </div>
              <div>
                <span className="text-[#A7B2C5] text-[10px] block">OPTICAL TUBE:</span>
                <span className="text-[#F3F0E8]">{selectedPhoto.equipment}</span>
              </div>
              <div>
                <span className="text-[#A7B2C5] text-[10px] block">COOLED CMOS / FILTERS:</span>
                <span className="text-[#F3F0E8]">{selectedPhoto.sensorSpecs}</span>
              </div>
              <div>
                <span className="text-[#A7B2C5] text-[10px] block">FIELD OF VIEW / SKY:</span>
                <span className="text-emerald-400">{selectedPhoto.fieldOfView}</span>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Calibration Pipeline Controls + Astrometric Target List */}
          <div className="lg:col-span-5 space-y-6">
            {/* Calibration & Spectral Controls Box */}
            <div className="p-6 rounded-3xl bg-[#172238] border border-[#D6AD60]/30 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D6AD60]/15 pb-3">
                <div className="flex items-center gap-2 text-xs font-mono text-[#D6AD60] uppercase tracking-wider">
                  <Sliders className="w-4 h-4" />
                  <span>FITS CALIBRATION PIPELINE</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={simulateUncalibratedStretch}
                    className="px-2.5 py-1 rounded-lg bg-[#10182A] text-amber-300 border border-amber-400/30 text-[10px] font-mono hover:bg-amber-400/15 transition-all cursor-pointer"
                    title="See what happens when you stretch a raw frame without Flat/Dark calibration"
                  >
                    RAW STRETCH DEFECTS
                  </button>
                  <button
                    onClick={resetToOptimalCalibration}
                    className="px-2.5 py-1 rounded-lg bg-[#10182A] text-[#A7B2C5] border border-[#D6AD60]/20 text-[10px] font-mono hover:text-[#F3F0E8] transition-all flex items-center gap-1 cursor-pointer"
                    title="Reset to optimal observatory calibration"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>OPTIMAL</span>
                  </button>
                </div>
              </div>

              {/* Spectral Bandpass Filter Selector */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-[#A7B2C5]">SPECTRAL BANDPASS MAPPING</span>
                  <span className="text-[#D6AD60]">
                    {BANDPASS_MODES.find((b) => b.id === settings.bandpassMode)?.badge}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {BANDPASS_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setSettings({ ...settings, bandpassMode: mode.id })}
                      className={`px-2.5 py-2 rounded-xl text-[10px] font-mono text-left transition-all cursor-pointer border ${
                        settings.bandpassMode === mode.id
                          ? 'bg-[#10182A] text-[#D6AD60] border-[#D6AD60] shadow-[0_0_10px_rgba(214,173,96,0.2)]'
                          : 'bg-[#10182A]/50 text-[#A7B2C5] border-transparent hover:border-[#D6AD60]/30 hover:text-[#F3F0E8]'
                      }`}
                    >
                      <div className="font-bold truncate">{mode.label}</div>
                      <div className="text-[9px] opacity-75">{mode.badge}</div>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#A7B2C5]/80 font-sans-body">
                  {BANDPASS_MODES.find((b) => b.id === settings.bandpassMode)?.desc}
                </p>
              </div>

              {/* Slider 1: Arcsinh Non-Linear Histogram Stretch */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#F3F0E8]">1. ARCSINH NON-LINEAR STRETCH (α)</span>
                  <span className="text-[#D6AD60] font-bold">+{settings.stretching}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.stretching}
                  onChange={(e) =>
                    setSettings({ ...settings, stretching: Number(e.target.value) })
                  }
                  className="w-full accent-[#D6AD60] bg-[#10182A] rounded-lg h-2 cursor-pointer"
                />
                <div className="text-[10px] text-[#A7B2C5] flex justify-between font-mono">
                  <span>0% (Linear γ=1.0)</span>
                  <span>HDR Core Compression Active</span>
                </div>
              </div>

              {/* Slider 2: Master Flat-Field & Dynamic Background Extraction (DBE) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#F3F0E8]">2. MASTER FLAT &amp; SKYGLOW DBE</span>
                  <span className="text-emerald-400 font-bold">{settings.flatCalibration}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.flatCalibration}
                  onChange={(e) =>
                    setSettings({ ...settings, flatCalibration: Number(e.target.value) })
                  }
                  className="w-full accent-[#D6AD60] bg-[#10182A] rounded-lg h-2 cursor-pointer"
                />
                <div className="text-[10px] text-[#A7B2C5] flex justify-between font-mono">
                  <span>0% (Vignetting + Green Skyglow)</span>
                  <span>100% (Flat Divided)</span>
                </div>
              </div>

              {/* Slider 3: Wavelet Denoising & Dark-Current Hot Pixel Rejection */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#F3F0E8]">3. WAVELET &amp; SIGMA-CLIP DENOISE</span>
                  <span className="text-[#D6AD60] font-bold">{settings.noiseReduction}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.noiseReduction}
                  onChange={(e) =>
                    setSettings({ ...settings, noiseReduction: Number(e.target.value) })
                  }
                  className="w-full accent-[#D6AD60] bg-[#10182A] rounded-lg h-2 cursor-pointer"
                />
                <div className="text-[10px] text-[#A7B2C5] flex justify-between font-mono">
                  <span>0% (Read Noise + Hot Pixels)</span>
                  <span>Multi-ScaleNR + Dark Subtract</span>
                </div>
              </div>

              {/* Slider 4: Richardson-Lucy PSF Deconvolution / Star Minimization */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#F3F0E8]">4. PSF DECONVOLUTION (STAR FWHM)</span>
                  <span className="text-cyan-400 font-bold">
                    {settings.starMinimization}% ({histogram?.effectiveFwhmArcsec ?? 2.28}″)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.starMinimization}
                  onChange={(e) =>
                    setSettings({ ...settings, starMinimization: Number(e.target.value) })
                  }
                  className="w-full accent-[#D6AD60] bg-[#10182A] rounded-lg h-2 cursor-pointer"
                />
                <div className="text-[10px] text-[#A7B2C5] flex justify-between font-mono">
                  <span>0% (Seeing Bloat 2.95″)</span>
                  <span>Tight Airy Core (1.47″)</span>
                </div>
              </div>

              {/* Slider 5: Spectrophotometric Chroma Saturation */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#F3F0E8]">5. SPECTROPHOTOMETRIC CHROMA</span>
                  <span className="text-[#D6AD60] font-bold">{settings.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.saturation}
                  onChange={(e) =>
                    setSettings({ ...settings, saturation: Number(e.target.value) })
                  }
                  className="w-full accent-[#D6AD60] bg-[#10182A] rounded-lg h-2 cursor-pointer"
                />
              </div>
            </div>

            {/* AI Spectral Plate-Solve & Identified Celestial Targets Box */}
            <div className="p-6 rounded-3xl bg-[#172238] border border-[#D6AD60]/30 space-y-4">
              <div className="flex items-center justify-between border-b border-[#D6AD60]/15 pb-3">
                <div className="flex items-center gap-2 text-xs font-mono text-[#D6AD60] uppercase tracking-wider">
                  <Zap className="w-4 h-4" />
                  <span>ASTROMETRIC &amp; SPECTRAL SOLVER</span>
                </div>

                <button
                  onClick={() => runAiAnalysis()}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 rounded-lg bg-[#10182A] text-[#D6AD60] border border-[#D6AD60]/40 text-[11px] font-mono hover:bg-[#D6AD60] hover:text-[#080D1A] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>{isAnalyzing ? 'SOLVING PLATE...' : 'AI SPECTRAL SOLVE'}</span>
                </button>
              </div>

              {/* AI Scientific Summary */}
              <p className="text-xs text-[#A7B2C5] leading-relaxed font-sans-body">
                {aiResult.analysis}
              </p>

              {/* Spectral Emission Line Diagnostics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono">
                <div className="p-2.5 rounded-xl bg-[#10182A] border border-rose-500/25">
                  <span className="text-rose-400 font-bold block">H-ALPHA (656.28nm)</span>
                  <span className="text-[#F3F0E8] mt-0.5 block">
                    {aiResult.spectralData?.hAlpha || selectedPhoto.spectralMetrics.hAlphaNm}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#10182A] border border-cyan-500/25">
                  <span className="text-cyan-400 font-bold block">[O III] (500.68nm)</span>
                  <span className="text-[#F3F0E8] mt-0.5 block">
                    {aiResult.spectralData?.oIII || selectedPhoto.spectralMetrics.oIIINm}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#10182A] border border-amber-500/25">
                  <span className="text-amber-400 font-bold block">[S II] (671.64nm)</span>
                  <span className="text-[#F3F0E8] mt-0.5 block">
                    {aiResult.spectralData?.sII || selectedPhoto.spectralMetrics.sIINm}
                  </span>
                </div>
              </div>

              {/* Plate-Solved Celestial Objects List */}
              <div className="space-y-2 pt-1">
                {aiResult.detectedObjects?.map((obj: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#10182A] border border-[#D6AD60]/20 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#F3F0E8] flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-[#D6AD60]">[{idx + 1}]</span>
                        <span>{obj.name}</span>
                      </div>
                      <div className="text-[10px] font-mono text-[#A7B2C5] mt-0.5">
                        {obj.type} · {obj.coordinates}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded bg-[#D6AD60]/15 text-[#D6AD60] font-mono font-bold text-[10px] border border-[#D6AD60]/30 block">
                        {Math.round((obj.confidence || 0.96) * 100)}% WCS
                      </span>
                      {obj.angularSize && (
                        <span className="text-[9px] font-mono text-[#A7B2C5] mt-0.5 block">
                          {obj.angularSize}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
