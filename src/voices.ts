/**
 * Voice configuration and metadata for Kokoro TTS
 */

import type { VoiceId, VoiceInfo, VoicePreset } from './types.js';

// Complete voice database with metadata
export const VOICES: Record<VoiceId, VoiceInfo> = {
  // American Female Voices
  af_heart: {
    name: 'Heart',
    language: 'en-us',
    gender: 'Female',
    traits: '❤️ Warm, expressive',
    targetQuality: 'A',
    overallGrade: 'A',
    description: 'Highest quality and most natural-sounding English (US) female voice'
  },
  af_alloy: {
    name: 'Alloy',
    language: 'en-us',
    gender: 'Female',
    targetQuality: 'B',
    overallGrade: 'C',
    description: 'Balanced female voice with metallic undertones'
  },
  af_aoede: {
    name: 'Aoede',
    language: 'en-us',
    gender: 'Female',
    targetQuality: 'B',
    overallGrade: 'C+',
    description: 'Musical and melodic female voice'
  },
  af_bella: {
    name: 'Bella',
    language: 'en-us',
    gender: 'Female',
    traits: '🔥 Clear, professional',
    targetQuality: 'A',
    overallGrade: 'A-',
    description: 'Clear and professional female voice, excellent quality'
  },
  af_jessica: {
    name: 'Jessica',
    language: 'en-us',
    gender: 'Female',
    targetQuality: 'C',
    overallGrade: 'D',
    description: 'Casual and friendly female voice'
  },
  af_kore: {
    name: 'Kore',
    language: 'en-us',
    gender: 'Female',
    targetQuality: 'B',
    overallGrade: 'C+',
    description: 'Youthful and energetic female voice'
  },
  af_nicole: {
    name: 'Nicole',
    language: 'en-us',
    gender: 'Female',
    traits: '🎧 Smooth, versatile',
    targetQuality: 'B',
    overallGrade: 'B-',
    description: 'Smooth and versatile female voice, good for podcasts'
  },
  af_nova: {
    name: 'Nova',
    language: 'en-us',
    gender: 'Female',
    targetQuality: 'B',
    overallGrade: 'C',
    description: 'Modern and contemporary female voice'
  },
  af_river: {
    name: 'River',
    language: 'en-us',
    gender: 'Female',
    targetQuality: 'C',
    overallGrade: 'D',
    description: 'Flowing and calm female voice'
  },
  af_sarah: {
    name: 'Sarah',
    language: 'en-us',
    gender: 'Female',
    targetQuality: 'B',
    overallGrade: 'C+',
    description: 'Friendly and natural female voice'
  },
  af_sky: {
    name: 'Sky',
    language: 'en-us',
    gender: 'Female',
    targetQuality: 'B',
    overallGrade: 'C-',
    description: 'Light and airy female voice'
  },

  // American Male Voices
  am_adam: {
    name: 'Adam',
    language: 'en-us',
    gender: 'Male',
    targetQuality: 'D',
    overallGrade: 'F+',
    description: 'Deep and authoritative male voice'
  },
  am_echo: {
    name: 'Echo',
    language: 'en-us',
    gender: 'Male',
    targetQuality: 'C',
    overallGrade: 'D',
    description: 'Resonant male voice with subtle echo'
  },
  am_eric: {
    name: 'Eric',
    language: 'en-us',
    gender: 'Male',
    targetQuality: 'C',
    overallGrade: 'D',
    description: 'Standard American male voice'
  },
  am_fenrir: {
    name: 'Fenrir',
    language: 'en-us',
    gender: 'Male',
    targetQuality: 'B',
    overallGrade: 'C+',
    description: 'Strong and powerful male voice'
  },
  am_liam: {
    name: 'Liam',
    language: 'en-us',
    gender: 'Male',
    targetQuality: 'C',
    overallGrade: 'D',
    description: 'Young and energetic male voice'
  },
  am_michael: {
    name: 'Michael',
    language: 'en-us',
    gender: 'Male',
    targetQuality: 'B',
    overallGrade: 'C+',
    description: 'Smooth and versatile male voice'
  },
  am_onyx: {
    name: 'Onyx',
    language: 'en-us',
    gender: 'Male',
    targetQuality: 'C',
    overallGrade: 'D',
    description: 'Dark and rich male voice'
  },
  am_puck: {
    name: 'Puck',
    language: 'en-us',
    gender: 'Male',
    targetQuality: 'B',
    overallGrade: 'C+',
    description: 'Playful and mischievous male voice'
  },
  am_santa: {
    name: 'Santa',
    language: 'en-us',
    gender: 'Male',
    targetQuality: 'C',
    overallGrade: 'D-',
    description: 'Jolly and warm male voice'
  },

  // British Female Voices
  bf_emma: {
    name: 'Emma',
    language: 'en-gb',
    gender: 'Female',
    traits: '🚺 Elegant, refined',
    targetQuality: 'B',
    overallGrade: 'B-',
    description: 'Elegant and refined British female voice'
  },
  bf_isabella: {
    name: 'Isabella',
    language: 'en-gb',
    gender: 'Female',
    targetQuality: 'B',
    overallGrade: 'C',
    description: 'Sophisticated British female voice'
  },
  bf_alice: {
    name: 'Alice',
    language: 'en-gb',
    gender: 'Female',
    traits: '🚺 Posh, articulate',
    targetQuality: 'C',
    overallGrade: 'D',
    description: 'Posh and articulate British female voice'
  },
  bf_lily: {
    name: 'Lily',
    language: 'en-gb',
    gender: 'Female',
    traits: '🚺 Sweet, gentle',
    targetQuality: 'C',
    overallGrade: 'D',
    description: 'Sweet and gentle British female voice'
  },

  // British Male Voices
  bm_george: {
    name: 'George',
    language: 'en-gb',
    gender: 'Male',
    targetQuality: 'B',
    overallGrade: 'C',
    description: 'Distinguished and clear British male voice'
  },
  bm_lewis: {
    name: 'Lewis',
    language: 'en-gb',
    gender: 'Male',
    targetQuality: 'C',
    overallGrade: 'D+',
    description: 'Modern British male voice'
  },
  bm_daniel: {
    name: 'Daniel',
    language: 'en-gb',
    gender: 'Male',
    traits: '🚹 Professional',
    targetQuality: 'C',
    overallGrade: 'D',
    description: 'Professional British male voice'
  },
  bm_fable: {
    name: 'Fable',
    language: 'en-gb',
    gender: 'Male',
    traits: '🚹 Storytelling',
    targetQuality: 'B',
    overallGrade: 'C',
    description: 'Narrative and storytelling British male voice'
  }
};

// Voice categories for easy filtering
export const VOICE_CATEGORIES = {
  american: Object.keys(VOICES).filter(id => VOICES[id as VoiceId].language === 'en-us') as VoiceId[],
  british: Object.keys(VOICES).filter(id => VOICES[id as VoiceId].language === 'en-gb') as VoiceId[],
  female: Object.keys(VOICES).filter(id => VOICES[id as VoiceId].gender === 'Female') as VoiceId[],
  male: Object.keys(VOICES).filter(id => VOICES[id as VoiceId].gender === 'Male') as VoiceId[],
  highQuality: Object.keys(VOICES).filter(id => ['A', 'A-', 'B'].includes(VOICES[id as VoiceId].overallGrade)) as VoiceId[],
  recommended: ['af_heart', 'af_bella', 'bf_emma', 'am_michael', 'bm_george'] as VoiceId[]
};

// Pre-defined voice presets for common use cases
export const VOICE_PRESETS: Record<string, VoicePreset> = {
  // Presentation presets
  'professional-female': {
    name: 'Professional Female',
    description: 'Clear and professional female voice for business presentations',
    voice: 'af_bella',
    speed: 0.9,
    temperature: 0.6,
    tags: ['professional', 'presentation', 'business']
  },
  'professional-male': {
    name: 'Professional Male',
    description: 'Authoritative male voice for corporate content',
    voice: 'am_michael',
    speed: 0.9,
    temperature: 0.6,
    tags: ['professional', 'presentation', 'business']
  },

  // Storytelling presets
  'storyteller': {
    name: 'Storyteller',
    description: 'Engaging voice perfect for narratives and stories',
    voice: 'bm_fable',
    speed: 0.8,
    temperature: 0.8,
    tags: ['storytelling', 'narrative', 'audiobook']
  },
  'warm-narrator': {
    name: 'Warm Narrator',
    description: 'Warm and expressive voice for emotional content',
    voice: 'af_heart',
    speed: 0.85,
    temperature: 0.8,
    tags: ['storytelling', 'warm', 'emotional']
  },

  // Educational presets
  'teacher': {
    name: 'Teacher',
    description: 'Clear and patient voice for educational content',
    voice: 'af_sarah',
    speed: 0.85,
    temperature: 0.5,
    tags: ['education', 'clear', 'patient']
  },
  'lecturer': {
    name: 'Lecturer',
    description: 'Authoritative voice for academic presentations',
    voice: 'bm_george',
    speed: 0.8,
    temperature: 0.6,
    tags: ['education', 'academic', 'formal']
  },

  // Casual presets
  'friendly': {
    name: 'Friendly',
    description: 'Casual and approachable voice for everyday content',
    voice: 'af_sarah',
    speed: 1.0,
    temperature: 0.7,
    tags: ['casual', 'friendly', 'conversational']
  },
  'energetic': {
    name: 'Energetic',
    description: 'Upbeat and lively voice for dynamic content',
    voice: 'af_kore',
    speed: 1.1,
    temperature: 0.8,
    tags: ['energetic', 'upbeat', 'dynamic']
  },

  // Podcast presets
  'podcast-host': {
    name: 'Podcast Host',
    description: 'Smooth and engaging voice perfect for podcasting',
    voice: 'af_nicole',
    speed: 0.95,
    temperature: 0.7,
    tags: ['podcast', 'smooth', 'engaging']
  },
  'interview-style': {
    name: 'Interview Style',
    description: 'Conversational voice for interview content',
    voice: 'am_michael',
    speed: 1.0,
    temperature: 0.6,
    tags: ['podcast', 'interview', 'conversational']
  },

  // News presets
  'news-anchor': {
    name: 'News Anchor',
    description: 'Clear and authoritative voice for news content',
    voice: 'af_bella',
    speed: 0.9,
    temperature: 0.5,
    tags: ['news', 'authoritative', 'clear']
  },
  'breaking-news': {
    name: 'Breaking News',
    description: 'Urgent and attention-grabbing voice for breaking news',
    voice: 'am_adam',
    speed: 1.0,
    temperature: 0.6,
    tags: ['news', 'urgent', 'breaking']
  }
};

// Utility functions for voice management
export function getVoiceInfo(voiceId: VoiceId): VoiceInfo {
  return VOICES[voiceId];
}

export function getVoicesByCategory(category: keyof typeof VOICE_CATEGORIES): VoiceId[] {
  return VOICE_CATEGORIES[category];
}

export function getVoicesByGrade(minGrade: string): VoiceId[] {
  const gradeOrder = ['F+', 'D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'A-', 'A'];
  const minIndex = gradeOrder.indexOf(minGrade);
  
  return Object.keys(VOICES).filter(id => {
    const voiceGrade = VOICES[id as VoiceId].overallGrade;
    return gradeOrder.indexOf(voiceGrade) >= minIndex;
  }) as VoiceId[];
}

export function getRecommendedVoice(gender?: 'Male' | 'Female', language?: 'en-us' | 'en-gb'): VoiceId {
  const filters = VOICE_CATEGORIES.recommended.filter(voiceId => {
    const voice = VOICES[voiceId];
    return (!gender || voice.gender === gender) && 
           (!language || voice.language === language);
  });
  
  return filters[0] || 'af_heart';
}

export function searchVoices(query: string): VoiceId[] {
  const lowerQuery = query.toLowerCase();
  return Object.keys(VOICES).filter(id => {
    const voice = VOICES[id as VoiceId];
    return voice.name.toLowerCase().includes(lowerQuery) ||
           voice.description?.toLowerCase().includes(lowerQuery) ||
           voice.traits?.toLowerCase().includes(lowerQuery) ||
           id.toLowerCase().includes(lowerQuery);
  }) as VoiceId[];
}

export function getVoicePreset(presetName: string): VoicePreset | undefined {
  return VOICE_PRESETS[presetName];
}

export function listVoicePresets(tags?: string[]): VoicePreset[] {
  const presets = Object.values(VOICE_PRESETS);
  if (!tags) return presets;
  
  return presets.filter(preset => 
    preset.tags?.some(tag => tags.includes(tag))
  );
}