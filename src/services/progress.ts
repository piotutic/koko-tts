/**
 * Progress tracking service
 */

import ora, { Ora } from 'ora'
import chalk from 'chalk'

export interface ProgressConfig {
  enabled: boolean
  interactive: boolean
  quiet: boolean
}

export class ProgressService {
  private config: ProgressConfig
  private spinner?: Ora
  private startTime?: number

  constructor(config: ProgressConfig) {
    this.config = config
  }

  start(message: string): void {
    if (!this.config.enabled || this.config.quiet) return
    
    this.startTime = Date.now()
    this.spinner = ora(message).start()
  }

  update(message: string): void {
    if (!this.spinner || this.config.quiet) return
    
    this.spinner.text = message
  }

  updateWithProgress(message: string, current: number, total: number): void {
    if (!this.spinner || this.config.quiet) return
    
    const percentage = Math.min(100, Math.max(0, (current / total) * 100))
    const progressBar = this.createProgressBar(percentage)
    this.spinner.text = `${message} ${progressBar} ${percentage.toFixed(1)}%`
  }

  succeed(message?: string): void {
    if (!this.spinner || this.config.quiet) return
    
    const finalMessage = message || this.spinner.text
    const duration = this.getDuration()
    
    this.spinner.succeed(
      this.config.interactive 
        ? finalMessage 
        : `${finalMessage}${duration ? ` (${duration})` : ''}`
    )
    this.cleanup()
  }

  fail(message?: string): void {
    if (!this.spinner || this.config.quiet) return
    
    this.spinner.fail(message || 'Operation failed')
    this.cleanup()
  }

  warn(message: string): void {
    if (!this.spinner || this.config.quiet) return
    
    this.spinner.warn(message)
    this.cleanup()
  }

  info(message: string): void {
    if (!this.spinner || this.config.quiet) return
    
    this.spinner.info(message)
    this.cleanup()
  }

  stop(): void {
    if (this.spinner) {
      this.spinner.stop()
      this.cleanup()
    }
  }

  // Static methods for one-off progress indicators
  static download(filename: string, progress: number): string {
    const bar = ProgressService.createStaticProgressBar(progress)
    return `⬇️  Downloading ${filename}: ${bar} ${progress.toFixed(1)}%`
  }

  static processing(step: number, total: number, current?: string): string {
    const bar = ProgressService.createStaticProgressBar((step / total) * 100)
    return `🔄 Processing ${current || `step ${step}/${total}`}: ${bar}`
  }

  private createProgressBar(percentage: number, width: number = 20): string {
    const filled = Math.floor((percentage / 100) * width)
    const empty = width - filled
    return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty))
  }

  private static createStaticProgressBar(percentage: number, width: number = 20): string {
    const filled = Math.floor((percentage / 100) * width)
    const empty = width - filled
    return '█'.repeat(filled) + '░'.repeat(empty)
  }

  private getDuration(): string | null {
    if (!this.startTime) return null
    
    const duration = (Date.now() - this.startTime) / 1000
    if (duration < 1) return null
    
    if (duration < 60) {
      return `${duration.toFixed(1)}s`
    } else {
      const minutes = Math.floor(duration / 60)
      const seconds = duration % 60
      return `${minutes}m ${seconds.toFixed(1)}s`
    }
  }

  private cleanup(): void {
    this.spinner = undefined
    this.startTime = undefined
  }

  isActive(): boolean {
    return !!this.spinner
  }
}

// Factory function
export function createProgressService(config: Partial<ProgressConfig>): ProgressService {
  const defaultConfig: ProgressConfig = {
    enabled: true,
    interactive: false,
    quiet: false
  }
  
  return new ProgressService({ ...defaultConfig, ...config })
}