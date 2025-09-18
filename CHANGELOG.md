# Changelog

All notable changes to Koko TTS CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-01-18

### Added
- **Organized Directory Structure**: New `.koko-tts/` directory for all app files
  - Date-based output organization: `.koko-tts/outputs/YYYY-MM-DD/`
  - Separate directories for CLI and interactive mode outputs
  - Session-based temp directories with auto-cleanup
  - Auto-migration from legacy `.koko-cache` and `.kokororc.yml`
- **Modular Service Architecture**: 
  - `DirectoryService` for organized file management
  - `CacheService` with LRU eviction and TTL
  - `AudioService` for centralized audio generation
  - `ProgressService` for enhanced user feedback
- **Enhanced Error Handling**: Comprehensive error recovery with retry logic
- **Code Quality Tools**: ESLint and Prettier configurations
- **Smart Text Chunking**: Better sentence boundary detection for natural speech

### Fixed
- **Complete Chunk Generation**: All chunks are now saved as separate files (not just the first)
- **Interactive Mode Directory**: Fixed output to use organized directory structure
- **File Input Validation**: Removed artificial 1KB file size limit
- **TypeScript Issues**: Fixed strict mode compliance and import problems

### Improved
- **Chunking Algorithm**: 
  - Reduced default chunk size from 1000 to 250 characters for safety buffer
  - Enhanced regex to include semicolons, colons, and paragraph breaks
  - Prioritized breaking points: paragraphs → sentences → commas → words
  - Preserved punctuation for better prosody
- **User Experience**:
  - Clear progress indicators with timing information
  - Better error messages with suggested actions
  - Organized file outputs with clear location feedback
  - Intelligent caching with cache hit/miss tracking

### Technical
- **Dependencies**: Added development dependencies for linting and formatting
- **TypeScript**: Enhanced type safety and strict mode compliance
- **Architecture**: Service-oriented design for better maintainability

## [0.1.2] - 2025-01-17

### Fixed
- Package preparation for npm publishing
- Clean npm package structure

## [0.1.1] - 2025-01-17

### Fixed
- CLI execution with npm/npx compatibility

## [0.1.0] - 2025-01-17

### Added
- Initial release of Koko TTS CLI
- 28 professional voices with quality grades
- Interactive and command-line modes
- Multiple output formats (WAV, PCM)
- Voice configuration and presets
