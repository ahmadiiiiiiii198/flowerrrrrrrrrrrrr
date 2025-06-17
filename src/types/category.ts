export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  images?: string[]; // For gallery images
  explanation?: string;
  features?: string[];
  color?: string;
  icon?: React.ReactNode;
  is_active?: boolean;
  sort_order?: number;
  labels?: string[]; // Labels/tags for categorization
  created_at?: string;
  updated_at?: string;
}

export interface CategoryContent {
  categories: Category[];
  heading: string;
  subheading: string;
}

// Product types - matching database schema exactly
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  slug: string;
  category_id: string | null;
  image_url: string | null;
  gallery: any | null; // JSON field for multiple images
  is_active: boolean | null;
  is_featured: boolean | null;
  stock_quantity: number | null;
  compare_price: number | null;
  sort_order: number | null;
  meta_title: string | null;
  meta_description: string | null;
  labels: string[] | null; // Labels/tags for categorization
  created_at: string;
  updated_at: string;

  // Computed fields for frontend compatibility
  category?: string;
  category_slug?: string;
  is_available?: boolean;
  images?: string[];
}

export interface ProductsByCategory {
  [categorySlug: string]: Product[];
}

export interface ProductsContent {
  products: ProductsByCategory;
  heading: string;
  subheading: string;
}

export interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  explanation: string;
  features: string[];
  color: string;
  is_active: boolean;
  sort_order: number;
}
