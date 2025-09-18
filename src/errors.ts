/**
 * Enhanced error handling system for Kokoro TTS CLI
 */

import chalk from 'chalk'

// Custom error classes
export class NetworkError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class FileError extends Error {
  constructor(message: string, public readonly filePath?: string) {
    super(message)
    this.name = 'FileError'
  }
}

export class ModelError extends Error {
  constructor(message: string, public readonly modelId?: string) {
    super(message)
    this.name = 'ModelError'
  }
}

// Retry configuration
export interface RetryOptions {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  exponential: boolean
  retryCondition?: (error: Error) => boolean
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  exponential: true,
  retryCondition: (error) => error instanceof NetworkError
}

// Retry wrapper function
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: Error = new Error('No attempts made')

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Check if we should retry this error
      if (!config.retryCondition?.(lastError)) {
        throw lastError
      }

      // Don't wait after the last attempt
      if (attempt === config.maxAttempts) {
        break
      }

      // Calculate delay
      const delay = config.exponential
        ? Math.min(config.baseDelay * Math.pow(2, attempt - 1), config.maxDelay)
        : config.baseDelay

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// Network-specific retry wrapper
export async function withNetworkRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3
): Promise<T> {
  return withRetry(operation, {
    maxAttempts,
    baseDelay: 2000,
    maxDelay: 10000,
    retryCondition: (error) => 
      error instanceof NetworkError || 
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND')
  })
}

// Error message formatter
export class ErrorFormatter {
  static formatError(error: Error): string {
    if (error instanceof NetworkError) {
      return this.formatNetworkError(error)
    }
    if (error instanceof ValidationError) {
      return this.formatValidationError(error)
    }
    if (error instanceof FileError) {
      return this.formatFileError(error)
    }
    if (error instanceof ModelError) {
      return this.formatModelError(error)
    }
    return this.formatGenericError(error)
  }

  private static formatNetworkError(error: NetworkError): string {
    return chalk.red(`Network Error: ${error.message}\n`) +
           chalk.yellow('💡 Suggestions:\n') +
           chalk.yellow('  • Check your internet connection\n') +
           chalk.yellow('  • Try again in a few moments\n') +
           chalk.yellow('  • Check if the service is temporarily unavailable')
  }

  private static formatValidationError(error: ValidationError): string {
    const fieldInfo = error.field ? ` (${error.field})` : ''
    return chalk.red(`Validation Error${fieldInfo}: ${error.message}\n`) +
           chalk.yellow('💡 Suggestions:\n') +
           chalk.yellow('  • Check the parameter values\n') +
           chalk.yellow('  • Use --help for valid options\n') +
           chalk.yellow('  • Review the documentation')
  }

  private static formatFileError(error: FileError): string {
    const pathInfo = error.filePath ? ` (${error.filePath})` : ''
    return chalk.red(`File Error${pathInfo}: ${error.message}\n`) +
           chalk.yellow('💡 Suggestions:\n') +
           chalk.yellow('  • Check if the file exists and is readable\n') +
           chalk.yellow('  • Verify file permissions\n') +
           chalk.yellow('  • Ensure the file path is correct')
  }

  private static formatModelError(error: ModelError): string {
    const modelInfo = error.modelId ? ` (${error.modelId})` : ''
    return chalk.red(`Model Error${modelInfo}: ${error.message}\n`) +
           chalk.yellow('💡 Suggestions:\n') +
           chalk.yellow('  • Try clearing the model cache\n') +
           chalk.yellow('  • Check available disk space\n') +
           chalk.yellow('  • Ensure stable internet connection')
  }

  private static formatGenericError(error: Error): string {
    return chalk.red(`Error: ${error.message}\n`) +
           chalk.yellow('💡 General suggestions:\n') +
           chalk.yellow('  • Use --verbose for more details\n') +
           chalk.yellow('  • Check the documentation\n') +
           chalk.yellow('  • Report persistent issues on GitHub')
  }

  static getRecoveryActions(error: Error): string[] {
    if (error instanceof NetworkError) {
      return [
        'Check internet connection',
        'Wait and retry',
        'Use different network if available'
      ]
    }
    if (error instanceof FileError) {
      return [
        'Verify file path is correct',
        'Check file permissions',
        'Ensure file is not locked by another process'
      ]
    }
    if (error instanceof ModelError) {
      return [
        'Clear model cache',
        'Check available disk space',
        'Restart the application'
      ]
    }
    return [
      'Check input parameters',
      'Try with different options',
      'Restart and try again'
    ]
  }
}

// Enhanced error handler for CLI
export function handleErrorWithRecovery(error: unknown, verbose = false): void {
  const err = error instanceof Error ? error : new Error(String(error))
  
  console.error(ErrorFormatter.formatError(err))
  
  if (verbose && err.stack) {
    console.error(chalk.gray('\nStack trace:'))
    console.error(chalk.gray(err.stack))
  }

  // Show recovery actions
  const actions = ErrorFormatter.getRecoveryActions(err)
  if (actions.length > 0) {
    console.error(chalk.cyan('\n🔧 Try these recovery actions:'))
    actions.forEach(action => console.error(chalk.cyan(`  • ${action}`)))
  }

  process.exit(1)
}

// Utility functions for creating specific errors
export function createNetworkError(message: string, originalError?: Error): NetworkError {
  return new NetworkError(message, originalError)
}

export function createValidationError(message: string, field?: string): ValidationError {
  return new ValidationError(message, field)
}

export function createFileError(message: string, filePath?: string): FileError {
  return new FileError(message, filePath)
}

export function createModelError(message: string, modelId?: string): ModelError {
  return new ModelError(message, modelId)
}

// Error recovery strategies
export class ErrorRecovery {
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    attempts = 3,
    _onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> {
    return withRetry(operation, {
      maxAttempts: attempts,
      baseDelay: 1000,
      exponential: true,
      retryCondition: () => true // Retry all errors for this helper
    })
  }

  static async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    condition?: (error: Error) => boolean
  ): Promise<T> {
    try {
      return await primary()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      if (!condition || condition(err)) {
        return await fallback()
      }
      throw err
    }
  }

  static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    timeoutMessage = 'Operation timed out'
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
      )
    ])
  }
}

// Global error handlers
export function setupGlobalErrorHandlers(verbose = false): void {
  process.on('uncaughtException', (error) => {
    console.error(chalk.red('\n💥 Uncaught Exception:'))
    handleErrorWithRecovery(error, verbose)
  })

  process.on('unhandledRejection', (reason) => {
    console.error(chalk.red('\n💥 Unhandled Rejection:'))
    handleErrorWithRecovery(reason, verbose)
  })
}