/**
 * Audio Stitcher Service
 * Combines multiple audio chunks into a single WAV file
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface AudioChunk {
  audio: Float32Array;
  sampling_rate: number;
  save: (path: string) => Promise<void>;
}

export interface StitchOptions {
  outputPath: string;
  keepChunks?: boolean;
  chunkDir?: string;
  tempDir?: string; // Temporary directory for intermediate processing
}

export interface StitchResult {
  outputPath: string;
  chunkPaths?: string[];
  totalDuration: number;
  totalSamples: number;
}

export class AudioStitcher {
  /**
   * Stitch multiple audio chunks into a single WAV file
   */
  static async stitchChunks(
    audioChunks: AudioChunk[], 
    options: StitchOptions
  ): Promise<StitchResult> {
    if (audioChunks.length === 0) {
      throw new Error('No audio chunks to stitch');
    }

    // If only one chunk, just save it directly
    if (audioChunks.length === 1) {
      await audioChunks[0]!.save(options.outputPath);
      return {
        outputPath: options.outputPath,
        totalDuration: audioChunks[0]!.audio.length / audioChunks[0]!.sampling_rate,
        totalSamples: audioChunks[0]!.audio.length
      };
    }

    // Validate all chunks have the same sample rate
    const sampleRate = audioChunks[0]!.sampling_rate;
    for (const chunk of audioChunks) {
      if (chunk.sampling_rate !== sampleRate) {
        throw new Error(`Sample rate mismatch: expected ${sampleRate}, got ${chunk.sampling_rate}`);
      }
    }

    // Calculate total samples
    const totalSamples = audioChunks.reduce((sum, chunk) => sum + chunk.audio.length, 0);
    
    // Combine all audio data
    const combinedAudio = new Float32Array(totalSamples);
    let offset = 0;
    
    for (const chunk of audioChunks) {
      combinedAudio.set(chunk.audio, offset);
      offset += chunk.audio.length;
    }

    // Generate WAV file
    const wavBuffer = this.generateWavBuffer(combinedAudio, sampleRate);
    
    // Use temp directory for intermediate processing if available
    let tempFilePath: string | undefined;
    if (options.tempDir) {
      await fs.mkdir(options.tempDir, { recursive: true });
      tempFilePath = path.join(options.tempDir, `stitched_${Date.now()}.wav`);
      await fs.writeFile(tempFilePath, wavBuffer);
    }
    
    // Ensure final output directory exists
    await fs.mkdir(path.dirname(options.outputPath), { recursive: true });
    
    // Move from temp to final location or write directly
    if (tempFilePath) {
      await fs.rename(tempFilePath, options.outputPath);
    } else {
      await fs.writeFile(options.outputPath, wavBuffer);
    }

    // Optionally save individual chunks
    let chunkPaths: string[] | undefined;
    if (options.keepChunks && options.chunkDir) {
      chunkPaths = await this.saveIndividualChunks(audioChunks, options.chunkDir);
    }

    return {
      outputPath: options.outputPath,
      chunkPaths,
      totalDuration: totalSamples / sampleRate,
      totalSamples
    };
  }

  /**
   * Generate WAV file buffer from Float32Array audio data
   */
  private static generateWavBuffer(audioData: Float32Array, sampleRate: number): Buffer {
    const bitsPerSample = 16;
    const numChannels = 1; // Mono
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    
    // Convert Float32Array to 16-bit PCM
    const pcmData = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      // Clamp and convert float32 (-1 to 1) to int16 (-32768 to 32767)
      const sample = Math.max(-1, Math.min(1, audioData[i]!));
      pcmData[i] = Math.round(sample * 32767);
    }
    
    const pcmBuffer = Buffer.from(pcmData.buffer);
    
    // Create WAV header
    const header = Buffer.alloc(44);
    let offset = 0;
    
    // RIFF chunk descriptor
    header.write('RIFF', offset); offset += 4;
    header.writeUInt32LE(36 + pcmBuffer.length, offset); offset += 4; // File size - 8
    header.write('WAVE', offset); offset += 4;
    
    // fmt sub-chunk
    header.write('fmt ', offset); offset += 4;
    header.writeUInt32LE(16, offset); offset += 4; // Subchunk1Size (16 for PCM)
    header.writeUInt16LE(1, offset); offset += 2; // AudioFormat (1 for PCM)
    header.writeUInt16LE(numChannels, offset); offset += 2; // NumChannels
    header.writeUInt32LE(sampleRate, offset); offset += 4; // SampleRate
    header.writeUInt32LE(byteRate, offset); offset += 4; // ByteRate
    header.writeUInt16LE(blockAlign, offset); offset += 2; // BlockAlign
    header.writeUInt16LE(bitsPerSample, offset); offset += 2; // BitsPerSample
    
    // data sub-chunk
    header.write('data', offset); offset += 4;
    header.writeUInt32LE(pcmBuffer.length, offset); // Subchunk2Size
    
    // Combine header and data
    return Buffer.concat([header, pcmBuffer]);
  }

  /**
   * Save individual chunks to a subdirectory
   */
  private static async saveIndividualChunks(
    audioChunks: AudioChunk[], 
    chunkDir: string
  ): Promise<string[]> {
    await fs.mkdir(chunkDir, { recursive: true });
    
    const chunkPaths: string[] = [];
    
    for (let i = 0; i < audioChunks.length; i++) {
      const chunkNumber = (i + 1).toString().padStart(3, '0');
      const chunkPath = path.join(chunkDir, `chunk_${chunkNumber}.wav`);
      
      await audioChunks[i]!.save(chunkPath);
      chunkPaths.push(chunkPath);
    }
    
    return chunkPaths;
  }

  /**
   * Estimate output file size in bytes
   */
  static estimateOutputSize(audioChunks: AudioChunk[]): number {
    const totalSamples = audioChunks.reduce((sum, chunk) => sum + chunk.audio.length, 0);
    const pcmBytes = totalSamples * 2; // 16-bit = 2 bytes per sample
    const headerBytes = 44; // WAV header size
    return headerBytes + pcmBytes;
  }

  /**
   * Get duration of all chunks combined
   */
  static getTotalDuration(audioChunks: AudioChunk[]): number {
    if (audioChunks.length === 0) return 0;
    
    const sampleRate = audioChunks[0]!.sampling_rate;
    const totalSamples = audioChunks.reduce((sum, chunk) => sum + chunk.audio.length, 0);
    
    return totalSamples / sampleRate;
  }
}