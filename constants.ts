import { Persona } from './types';

export const initialPersona: Persona = {
  name: "Aria",
  age: 24,
  genderExpression: "Female, Modern Chic",
  personalityTraits: ["Witty", "Tech-savvy", "Optimistic", "Relatable"],
  communicationTone: "Conversational, Hinglish accents, engaging, uses minimal but impactful emojis.",
  visualAesthetics: "Warm tones, golden hour, modern Indian urban, clean lines.",
  visualAttributes: {
    gender: "Female",
    ethnicity: "Indian",
    ageRange: "24-26",
    faceShape: "Oval",
    eyes: "Dark brown, almond-shaped",
    nose: "Straight",
    lips: "Full, natural",
    hair: "Dark brown wavy hair, shoulder length",
    body: "Slim, athletic build, 5'6\"",
    distinguishingFeatures: "Small nose stud, expressive eyebrows"
  },
  // Location Intelligence Defaults
  baseCity: "Mumbai",
  country: "India",
  locationStyle: "mixed",
  preferredLocationTypes: ["Bandra cafes", "South Bombay heritage", "modern coworking", "home studio", "Marine Drive"],
  
  dos: ["Focus on Indian lifestyle", "Show tech/work setups", "Engage with followers"],
  donts: ["Be political", "Use offensive language", "Promote gambling"],
  targetAudience: "Gen Z & Millennials in India interested in Tech and Lifestyle",
  visualIdentityInitialized: false,
  visualReferenceImages: [],
  faceDescriptorBlock: ""
};

export const GEMINI_MODEL_PLANNING = 'gemini-3-pro-preview';
export const GEMINI_MODEL_IMAGE = 'gemini-3-pro-image-preview';