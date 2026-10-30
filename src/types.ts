export interface StargazingLocation {
  id: string;
  name: string;
  kanji: string;
  lat: number;
  lng: number;
  bortleClass: number; // 1 (darkest) to 9 (inner city)
  elevation: number; // meters
}

export interface StargazingCondition {
  location: StargazingLocation;
  nightHonorScore: number; // 0 to 100
  statusLabel: 'EXCELLENT' | 'VERY GOOD' | 'FAIR' | 'POOR';
  cloudCoverPercentage: number;
  humidityPercentage: number;
  visibilityKm: number;
  seeingQuality: number; // 1 to 5
  transparencyQuality: number; // 1 to 5
  windSpeedKmH: number;
  temperatureCelsius: number;
  moonIlluminationPercentage: number;
  lightPollutionDescription: string;
}

export type EventType = 'meteor_shower' | 'eclipse' | 'moon_phase' | 'iss_pass' | 'rocket_launch';

export interface CelestialEvent {
  id: string;
  title: string;
  japaneseTitle: string;
  type: EventType;
  dateStr: string;
  peakTime: string;
  constellationOrTarget: string;
  visibilityRating: number; // 1 to 5 stars
  description: string;
  observationTips: string;
  zhrOrMagnitude?: string; // Zenithal Hourly Rate or Magnitude
  badgeColor?: string;
}

export interface DetectedObject {
  name: string;
  confidence: number;
  type: string;
  coordinates: string;
  xPercent?: number; // 0-100 canvas position for WCS plate-solving overlay
  yPercent?: number; // 0-100 canvas position for WCS plate-solving overlay
  angularSize?: string;
}

export type SpectralBandpassMode = 'lrgb' | 'hoo' | 'sho' | 'halpha' | 'inverted';

export interface ImageEnhancementState {
  noiseReduction: number; // 0 to 100 (Wavelet & Sigma-Clip Denoising)
  stretching: number; // 0 to 100 (Arcsinh / MTF Non-Linear Histogram Stretch)
  starMinimization: number; // 0 to 100 (PSF Deconvolution & Morphological Star Reduction)
  flatCalibration: number; // 0 to 100 (Master Flat Vignetting & Skyglow DBE Removal)
  colorTemp: number; // 3000 to 8000
  saturation: number; // 0 to 100 (Spectrophotometric Chroma Boost)
  bandpassMode: SpectralBandpassMode;
}

export interface SamplePhoto {
  id: string;
  title: string;
  targetName: string;
  catalogId: string;
  objectCategory: 'galaxy' | 'emission_nebula' | 'reflection_cluster' | 'supernova_remnant' | 'custom';
  originalUrl: string;
  enhancedUrl: string;
  exposureTime: string;
  subFrameInfo: string;
  equipment: string;
  sensorSpecs: string;
  bortleSky: string;
  raCenter: string;
  decCenter: string;
  fieldOfView: string;
  spectralMetrics: {
    hAlphaNm: string;
    oIIINm: string;
    sIINm: string;
    rawMedianAdu: number;
    stretchedMedianAdu: number;
    baseSnrDb: number;
    rawFwhmArcsec: number;
  };
  detectedObjects: DetectedObject[];
}

export interface LogbookEntry {
  id: string;
  date: string;
  time: string;
  location: string;
  targetObject: string;
  honorScore: number;
  notes: string;
  equipment: string;
  rating: number;
}
