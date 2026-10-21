export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface UserProfile {
  id?: string;
  name?: string;
  email: string;
}

export interface Settings {
  site_name: string;
  site_tagline: string;
  contact_email: string;
  contact_phone: string;
  shipping_cost: string;
  free_shipping_min: string;
  instapay_number: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  products?: Product[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  stock: number;
  inStock: boolean;
  description: string;
  price: string;
  price_after_discount: string | null;
  category?: Category;
  image?: string;
  pivot?: { quantity: number };
}

export interface CartComponent {
  id: number;
  name: string;
  slug: string;
  quantity: number;
  imageUrl?: string;
}

export interface CartItem {
  id: number | string;
  key?: string;
  kind?: "product" | "bundle" | "legacy-bundle";
  name: string;
  slug: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  spec?: string;
  bundleId?: number;
  components?: CartComponent[];
  needsReselection?: boolean;
}

export interface Order {
  id: number,
  total_amount: string,
  discount_amount: string,
  status: string,
  is_paid: boolean,
  shipping_address?: string,
  items: OrderItem[]
}

export interface OrderItem {
  id: number,
  product: Product,
  quantity: number,
  price: string
}

export interface Bundle {
  id: number;
  title: string;
  slug: string;
  description: string;
  image: string | null;
  bundle_price: string;
  original_price: number;
  savings: number;
  products: Product[];
}