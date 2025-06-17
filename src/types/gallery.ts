
import type { Json } from '@/integrations/supabase/types';

export interface GalleryImage {
  id: string;
  url?: string; // New field for image URL
  src?: string; // Legacy field for compatibility
  title?: string; // Image title
  alt?: string; // Legacy field for compatibility
  description?: string; // Image description
  order?: number; // Display order
  is_featured?: boolean; // Featured status
  featured?: boolean; // Legacy field for compatibility
  created_at?: string; // Creation timestamp
  updated_at?: string; // Update timestamp
}

export interface GalleryContent {
  heading: string;
  subheading: string;
}

// This type ensures compatibility with Supabase's Json type
export type JsonCompatible<T> = {
  [K in keyof T]: T[K] extends Date
    ? string
    : T[K] extends object
    ? JsonCompatible<T[K]>
    : T[K];
};

// Helper function to safely convert objects to/from JSON type
export function safeJsonParse<T>(data: any): Json {
  try {
    // If it's already an object, stringify then parse to ensure compatible structure
    if (typeof data === 'object' && data !== null) {
      return JSON.parse(JSON.stringify(data)) as Json;
    }
    return data as Json;
  } catch (e) {
    console.error("Error parsing JSON:", e);
    throw e;
  }
}
