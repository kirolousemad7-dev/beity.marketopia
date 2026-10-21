/**
 * Browser/API contracts. Dynamic translations are already resolved by the API
 * using the Accept-Language header.
 *
 * @typedef {{id: number, name: string, slug: string}} Category
 * @typedef {{id: number, name: string, slug: string, description: string,
 *   stock: number, inStock: boolean, price: string, price_after_discount: string|null,
 *   category?: Category, image?: string|null, pivot?: {quantity: number}}} Product
 * @typedef {{id: number, title: string, slug: string, description: string,
 *   bundle_price: string, original_price: string|number, savings: string|number,
 *   image?: string|null, products: Product[]}} Bundle
 * @typedef {{id: number, name: string, email: string}} User
 * @typedef {{shipping_cost: string, instapay_number: string,
 *   contact_phone: string, contact_email: string}} Settings
 * @typedef {{key: string, id: number|string, name: string, slug: string,
 *   price: number, quantity: number, stock?: number, imageUrl?: string|null,
 *   bundleId?: number, spec?: string}} CartItem
 * @typedef {{method?: 'GET'|'POST'|'PUT'|'DELETE', data?: Record<string, unknown>|FormData,
 *   authenticated?: boolean, retries?: number}} RequestOptions
 */

/**
 * @template T
 * @typedef {{success: boolean, message: string|Record<string, unknown>, data: T,
 *   errors?: Record<string, string[]>, meta?: {current_page: number,
 *   last_page: number, per_page?: number, total?: number}}} ApiResponse
 */

export {};
