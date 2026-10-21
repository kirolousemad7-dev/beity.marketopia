import { Locale } from "@/i18n/config";
import { Category, Product, ApiResponse, Order, Settings, Bundle, CartItem } from "./types";
import { Dictionary } from "@/i18n/getDictionary";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function api({
  enpoint,
  revalidate = 60,
  method = 'GET',
  data = {},
  isAuth = false,
  isFormData = false,
  lang
}: {
  enpoint: string;
  revalidate?: number;
  method?: string;
  data?: Record<string, any>;
  isAuth?: boolean;
  isFormData?: boolean;
  lang?: string
}): Promise<Response> {

  let headers: Record<string, any> = {};

  if (lang) {
    headers["Accept-Language"] = lang
  }

  if (!isFormData) {
    headers["Content-Type"] = "application/json"
  }

  if (isAuth) {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      if (token) headers['Authorization'] = `Bearer ${token}`
    } else {
      try {
        const { cookies } = await import('next/headers');
        const token = (await cookies()).get('auth_token')?.value;
        if (token) headers['Authorization'] = `Bearer ${token}`
      } catch { }
    }
  }

  let initPayload: Record<string, any> = {
    method: method,
    headers,
    next: { revalidate: revalidate },
  };

  if (method !== 'GET' && data) {
    initPayload['body'] = isFormData ? data as FormData : JSON.stringify(data);
  }

  console.log(`API Request: ${method} ${API_BASE_URL}/${enpoint}`, initPayload);

  const response = await fetch(`${API_BASE_URL}/${enpoint}`, initPayload);
  return response;
}

export async function fetchSettings(): Promise<Settings> {
  const res = await api({ enpoint: 'settings' });
  const json = await res.json();
  return json.data as Settings;
}

export async function fetchCategories(lang: string): Promise<Category[]> {
  try {
    const res = await api({ enpoint: 'categories', isAuth: false, lang: lang, revalidate: 3600 });
    if (!res.ok) {
      console.warn(`Failed to fetch categories (Status: ${res.status})`);
      return [];
    }
    const json: ApiResponse<Category[]> = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("fetchCategories error:", error);
    return [];
  }
}

export async function fetchProducts(
  lang: Locale,
  categorySlug?: string,
  options: { requireStaticParams?: boolean } = {},
): Promise<Product[]> {
  try {
    let enpoint = 'products';
    if (categorySlug && categorySlug !== "all") {
      enpoint += `?category=${categorySlug}`;
    }
    const res = await api({ enpoint: enpoint, isAuth: false, lang: lang, revalidate: options.requireStaticParams ? 0 : 60 });
    if (!res.ok) {
      throw new Error(`Failed to fetch products (Status: ${res.status})`);
    };
    const json: ApiResponse<Product[]> = await res.json();
    if (!Array.isArray(json.data)) {
      throw new Error("The products API must return an array in data.");
    }
    // Products without slugs cannot have detail pages in a static export.
    return json.data.filter(hasProductSlug);
  } catch (error) {
    if (options.requireStaticParams) {
      throw new Error(
        "Cannot generate product routes. Check NEXT_PUBLIC_API_URL and ensure the catalog API is reachable before building.",
        { cause: error },
      );
    }
    console.error("fetchProducts error:", error);
    return [];
  }
}

function hasProductSlug(product: Product): boolean {
  return typeof product?.slug === "string" && product.slug.trim().length > 0;
}

export async function fetchBestSeller(lang: string): Promise<Product[]> {
  try {
    let enpoint = 'products/best-selling';
    const res = await api({ enpoint: enpoint, isAuth: false, lang: lang });
    if (!res.ok) {
      console.warn(`Failed to fetch best selling products (Status: ${res.status})`);
      return [];
    }
    const json: ApiResponse<Product[]> = await res.json();
    return Array.isArray(json.data) ? json.data.filter(hasProductSlug) : [];
  } catch (error) {
    console.error("fetchBestSeller error:", error);
    return [];
  }
}

export async function fetchProductBySlug(slug: string, lang: string): Promise<Product | null> {
  try {
    const res = await api({ enpoint: `products/${slug}`, lang: lang });
    if (!res.ok) return null;
    const json: ApiResponse<Product> = await res.json();
    return json.data || null;
  } catch (error) {
    console.error(`fetchProductBySlug error for ${slug}:`, error);
    return null;
  }
}

export async function fetchOrders(): Promise<Order[]> {
  try {
    const res = await api({ enpoint: 'orders', revalidate: 0, isAuth: true });
    if (!res.ok) return [];
    const json: ApiResponse<Order[]> = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.error("fetchOrders error:", error);
    return [];
  }
}

export async function applyCoupon(code: string, order_amount: number, dict: Dictionary) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  if (!token) return { success: false, message: dict.api.login_required }

  try {
    const res = await api({
      enpoint: 'coupons/apply',
      method: "POST",
      data: { code, order_amount },
      isAuth: true
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      return { success: false, message: json.message || json.errors || dict.api.invalid_coupon }
    }
    return { success: true, message: json.message, data: json.data }
  } catch (error) {
    return { success: false, message: dict.api.coupon_failed.replace("{error}", String(error)) }
  }
}

export async function checkoutOrder(
  items: Array<CartItem>,
  paymentMethod: string,
  shipping: string,
  dict: Dictionary,
  totalAmount: number,
  couponCode?: string | null,
  screenshot?: File | null,
) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  if (!token) {
    return { success: false, message: dict.api.login_required }
  }

  if (!['cash_on_delivery', 'wallet', 'instapay'].includes(paymentMethod)) {
    return { success: false, message: dict.api.select_payment }
  }

  if (!shipping || !shipping.trim()) {
    return { success: false, message: dict.api.shipping_required }
  }

  if (paymentMethod !== "cash_on_delivery" && !screenshot) {
    return { success: false, message: dict.api.screenshot_required }
  }

  try {
    const formData = new FormData();
    formData.append('shipping_address', shipping);
    formData.append('payment_method', paymentMethod);
    
    if (couponCode) formData.append('coupon_code', couponCode);
    if (screenshot) formData.append('payment_screenshot', screenshot);

    const products = items.filter((item) => item.kind !== "bundle" && item.kind !== "legacy-bundle" && !item.bundleId);
    const bundles = items.filter((item) => item.kind === "bundle" && !item.needsReselection && item.bundleId);
    if (items.some((item) => item.kind === "legacy-bundle" || item.needsReselection || (item.bundleId && item.kind !== "bundle"))) {
      return { success: false, message: dict.api.checkout_failed.replace("{error}", "package") };
    }
    products.forEach((item, i) => {
      formData.append(`items[${i}][product_id]`, String(item.id));
      formData.append(`items[${i}][quantity]`, String(item.quantity));
    });
    bundles.forEach((item, i) => {
      formData.append(`bundles[${i}][bundle_id]`, String(item.bundleId));
      formData.append(`bundles[${i}][quantity]`, String(item.quantity));
    });
    
    formData.append(`total_amount`, String(totalAmount));

    console.log('Items: ', items)

    const res = await api({ enpoint: 'orders/checkout', method: "POST", data: formData, isAuth: true, isFormData: true });
    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return { success: false, message: json?.message || dict.api.checkout_failed.replace("{error}", res.statusText) }
    }
    return { success: true, message: json?.message || dict.api.checkout_success }
  } catch (error) {
    return { success: false, message: dict.api.checkout_failed.replace("{error}", String(error)) }
  }
}

export async function fetchBundles(lang: string = 'en') {
  try {
    const res = await api({ enpoint: 'bundles', lang: lang, revalidate: 30 });

    if (!res.ok) {
      console.warn(`Warning: Failed to fetch bundles (Status: ${res.status})`);
      return [];
    }

    const json: ApiResponse<Bundle[]> = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (error) {
    console.warn("Network error while fetching bundles during build:", error);
    return [];
  }
}

export async function fetchBundleBySlug(slug: string, lang: string): Promise<Bundle | null> {
  const res = await api({ enpoint: `bundles/${slug}`, lang: lang });
  if (!res.ok) {
    console.warn(`Warning: Failed to fetch bundle by slug (Status: ${res.status})`);
    return null;
  }
  
  const json: ApiResponse<Bundle> = await res.json();
  return json.data || null;
}
