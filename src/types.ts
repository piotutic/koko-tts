/**
 * TypeScript type definitions for Kokoro TTS
 */

// Device types supported by Kokoro TTS
export type Device = 'cpu' | 'wasm' | 'webgpu';

// Data type precision options
export type DType = 'fp32' | 'fp16' | 'q8' | 'q4' | 'q4f16';

// Available voice IDs
export type VoiceId = 
  | 'af_heart' | 'af_alloy' | 'af_aoede' | 'af_bella' | 'af_jessica' | 'af_kore' 
  | 'af_nicole' | 'af_nova' | 'af_river' | 'af_sarah' | 'af_sky'
  | 'am_adam' | 'am_echo' | 'am_eric' | 'am_fenrir' | 'am_liam' | 'am_michael'
  | 'am_onyx' | 'am_puck' | 'am_santa'
  | 'bf_emma' | 'bf_isabella' | 'bf_alice' | 'bf_lily'
  | 'bm_george' | 'bm_lewis' | 'bm_daniel' | 'bm_fable';

// Voice gender classification
export type Gender = 'Male' | 'Female';

// Language codes
export type Language = 'en-us' | 'en-gb';

// Output audio formats
export type AudioFormat = 'wav' | 'pcm';

// Voice quality grades
export type QualityGrade = 'A' | 'A-' | 'B' | 'B-' | 'C' | 'C+' | 'C-' | 'D' | 'D+' | 'D-' | 'F+';

// Voice metadata interface
export interface VoiceInfo {
  name: string;
  language: Language;
  gender: Gender;
  traits?: string;
  targetQuality: QualityGrade;
  overallGrade: QualityGrade;
  description?: string;
}

// TTS model initialization options
export interface ModelOptions {
  dtype?: DType;
  device?: Device;
  progress_callback?: (progress: ProgressInfo) => void;
}

// Progress information for model loading
export interface ProgressInfo {
  status: 'downloading' | 'done' | 'error';
  progress?: number;
  file?: string;
  loaded?: number;
  total?: number;
}

// Audio generation options
export interface GenerationOptions {
  voice?: VoiceId;
  speed?: number;
  temperature?: number;
  streamed?: boolean;
  streaming_callback?: (chunk: ArrayBuffer) => void;
}

// Streaming generation options
export interface StreamingOptions extends Omit<GenerationOptions, 'streamed' | 'streaming_callback'> {
  split_pattern?: RegExp;
}

// CLI options interface
export interface CliOptions {
  voice: VoiceId;
  speed: number;
  temperature: number;
  device: Device;
  dtype: DType;
  output: string;
  format: AudioFormat;
  streaming: boolean;
  text?: string;
  inputFile?: string;
  outputDir?: string;
  help: boolean;
  listVoices: boolean;
  interactive: boolean;
  verbose: boolean;
  quiet: boolean;
  config?: string;
  saveConfig?: string;
  batch?: boolean;
  preview?: boolean;
  autoChunk?: boolean;
  chunkSize?: number;
  warnLimit?: boolean;
}

// Cache configuration interface
export interface CacheConfig {
  enabled?: boolean;
  directory?: string;
  maxSizeBytes?: number;
  ttlSeconds?: number;
  maxEntries?: number;
  cleanupIntervalMs?: number;
}

// Configuration file structure
export interface ConfigFile {
  defaults: Partial<CliOptions>;
  presets?: Record<string, Partial<GenerationOptions>>;
  voices?: Partial<Record<VoiceId, Partial<GenerationOptions>>>;
  cache?: CacheConfig;
}

// Batch processing job
export interface BatchJob {
  text: string;
  outputFile: string;
  options?: Partial<GenerationOptions>;
}

// Audio metadata
export interface AudioMetadata {
  duration: number;
  sampleRate: number;
  samples: number;
  generationTime: number;
  realTimeFactor: number;
}

// Streaming chunk information
export interface StreamChunk {
  text: string;
  phonemes: string;
  audio: any; // RawAudio from kokoro-js
}

// Validation error
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// CLI command result
export interface CommandResult {
  success: boolean;
  message?: string;
  data?: any;
  errors?: ValidationError[];
}

// Voice preset
export interface VoicePreset {
  name: string;
  description?: string;
  voice: VoiceId;
  speed: number;
  temperature: number;
  tags?: string[];
}

// Performance metrics
export interface PerformanceMetrics {
  modelLoadTime: number;
  textProcessingTime: number;
  audioGenerationTime: number;
  totalTime: number;
  memoryUsage?: {
    before: number;
    after: number;
    peak: number;
  };
}

// File input options
export interface FileInputOptions {
  encoding?: BufferEncoding;
  maxSize?: number;
  allowedExtensions?: string[];
}

// Output options
export interface OutputOptions {
  overwrite?: boolean;
  createDirs?: boolean;
  backup?: boolean;
}

// Validation constraints
export interface ValidationConstraints {
  speed: { min: number; max: number };
  temperature: { min: number; max: number };
  textLength: { min: number; max: number };
  fileSize: { max: number };
}

// Default values
export const DEFAULT_OPTIONS: Required<Pick<CliOptions, 'voice' | 'speed' | 'temperature' | 'device' | 'dtype' | 'format'>> = {
  voice: 'af_sarah',
  speed: 1.0,
  temperature: 0.7,
  device: 'cpu',
  dtype: 'q8',
  format: 'wav'
};

// Validation constraints
export const VALIDATION_CONSTRAINTS: ValidationConstraints = {
  speed: { min: 0.5, max: 2.0 },
  temperature: { min: 0.1, max: 1.0 },
  textLength: { min: 1, max: 10000 },
  fileSize: { max: 10 * 1024 * 1024 } // 10MB
};

// Supported file extensions
export const SUPPORTED_TEXT_EXTENSIONS = ['.txt', '.md', '.json', '.csv'];
export const SUPPORTED_AUDIO_EXTENSIONS = ['.wav', '.pcm'];

// Model ID constant
export const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';