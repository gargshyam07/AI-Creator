import React from 'react';

export enum PostStatus {
  PLANNED = 'PLANNED',
  GENERATED = 'GENERATED',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED'
}

export type ContentType = 'feed_post' | 'carousel' | 'story';
export type StrategyType = 'organic_feed' | 'organic_story' | 'brand_feed' | 'brand_story' | 'organic_reel' | 'brand_reel';
export type LocationStyle = 'lifestyle' | 'luxury' | 'travel' | 'local' | 'mixed';

export interface StrategyCard {
  id: string;
  type: StrategyType;
  createdAt: number;
  
  // Origin Tracking
  source?: 'auto' | 'manual' | 'intelligence';

  // Core Content
  visualIdea: string;
  scene: string;
  mood: string;
  story: string; // The "Why" or narrative
  captionDirection: string;
  suggestedDate?: string; // AI Suggested Date (YYYY-MM-DD)
  
  // Manual Control Specifics
  cameraStyle?: string;
  referenceImageId?: string; // Optional user uploaded reference
  
  // Brand Specifics
  brandId?: string;
  brandName?: string;
  productName?: string;
  productContext?: string;
  mandatoryMentions?: string[];
  
  // UI State
  isPushed?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  imageIds: string[]; // Storage IDs
  isPrimary: boolean;
}

export interface Brand {
  id: string;
  name: string;
  industry: string;
  productName: string; // Legacy/Simple field
  productDescription: string; // Legacy/Simple field
  
  // New Product Data Model
  products: Product[];

  websiteUrl?: string;
  instagramHandle?: string;
  tone: string;
  keySellingPoints: string[];
  targetAudience: string;
  campaignObjective: string;
  mandatoryMentions: string[];
  dos: string[];
  donts: string[];
  contentTypes: ContentType[];
  postingFrequency: string; // e.g. "2 posts/month"
  
  // Campaign Duration & Timing
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  preferredWeeks?: number[]; // e.g. [1, 3]
  
  createdAt: number;
}

export interface Influencer {
  id: string;
  name: string;
  handle: string; // e.g. @arianova
  createdAt: number;
}

export interface VisualAttributes {
  gender: string;
  ethnicity: string;
  ageRange: string;
  faceShape: string;
  eyes: string;
  nose: string;
  lips: string;
  hair: string;
  body: string;
  distinguishingFeatures: string;
  // ... any other visual attributes
}

export interface Persona {
  name: string;
  age: number;
  genderExpression: string;
  personalityTraits: string[];
  communicationTone: string;
  visualAesthetics: string;
  visualAttributes: VisualAttributes; // New field for prompt pack
  dos: string[];
  donts: string[];
  targetAudience: string;
  
  // Location Intelligence
  baseCity: string;
  country: string;
  locationStyle: LocationStyle;
  preferredLocationTypes: string[]; // e.g. ['cafes', 'rooftops']

  // Visual Identity System
  visualIdentityInitialized: boolean;
  visualReferenceImages: string[]; // [0]=Front, [1]=45L, [2]=45R, [3]=Side, [4]=Lifestyle
  faceDescriptorBlock: string; // Immutable text description used for locking
}

export type PlanType = 'organic' | 'brand';

export interface QuarterlyPlan {
  id: string;
  type: PlanType; // New field to distinguish plans
  brandId?: string; // Only for brand plans
  quarter: string; // e.g., "Q1 2024"
  brandPositioning: string;
  coreThemes: string[];
  visualDirection: string;
  months: MonthlyPlan[];
}

export interface MonthlyPlan {
  id: string;
  monthName: string;
  campaigns: string[];
  focusTopics: string[];
  weeks: WeeklyPlan[];
}

export interface WeeklyPlan {
  id: string;
  weekNumber: number;
  postingFrequency: number;
  emotionalIntent: string;
  dailyIdeas: DailyPostIdea[];
  dailyStories?: DailyStory[]; // New dedicated stories container
}

export interface StoryFrame {
  id: string;
  sequenceNumber: number;
  imagePrompt: string;
  textOverlay?: string;
  interactionType?: 'poll' | 'question' | 'slider' | 'none';
  interactionPrompt?: string; // e.g. "Coffee or Tea?"
  imageUrl?: string;
}

export interface DailyStory {
  id: string;
  day: string; // e.g. "Monday"
  concept: string; // "Morning coffee run"
  frames: StoryFrame[];
  isSelected?: boolean;
}

export interface DailyPostIdea {
  day: string;
  contentType: ContentType; 
  hook: string;
  concept: string;
  cta: string;
  hashtags: string[];
  
  // Location Data
  locationName?: string; 
  locationType?: string; 
  isLocationSpecific?: boolean;

  // Sponsorship Data
  isSponsored?: boolean;
  brandId?: string;
  brandName?: string;
  
  // UI State for Merging
  isSelected?: boolean;
}

export interface CarouselSlide {
  slideNumber: number;
  imagePrompt: string;
  imageUrl?: string;
  textOverlay?: string;
}

export interface Post {
  id: string;
  status: PostStatus;
  createdAt: number;
  
  // Scheduling Data (New)
  scheduledDate?: string; // ISO Date String YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  
  // Lineage
  planId?: string; // Links back to a plan
  strategyItemId?: string; // Optional link to specific strategy item

  // Content Type
  type: ContentType;

  // Shared Content
  caption: string;
  hashtags: string[];
  hook: string;
  
  // Location Metadata
  locationName?: string;
  baseCity?: string;

  // Sponsorship Data
  isSponsored?: boolean;
  brandId?: string;
  brandName?: string;
  campaignObjective?: string;
  productName?: string; // Specific product featured
  productImageIds?: string[]; // IDs of product images used as reference

  // Type Specifics
  imagePrompt?: string; 
  imageUrl?: string;
  
  // Carousel
  carouselSlides?: CarouselSlide[];

  // Stories
  storyFrames?: StoryFrame[];

  // Logs
  rejectionReason?: string;
  publishLog?: string;
}

// --- LEARNING FRAMEWORK TYPES ---

export interface LearningArchetype {
    id: string;
    label: string;
    sourceInspiration: string; // e.g. "Global Retail Leader" (Abstracted)
    coreThemes: string[];
    visualStyle: string;
    toneTraits: string[];
    engagementTactics: string[];
}

export interface AdaptedStrategy {
    archetypeId: string;
    archetypeLabel: string;
    indianAdaptationSummary: string;
    adaptedThemes: string[];
    visualDirection: string;
    toneAdjustments: string;
    suggestedConcepts: {
        hook: string;
        concept: string;
        reasoning: string;
    }[];
}

// Navigation helpers
export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}