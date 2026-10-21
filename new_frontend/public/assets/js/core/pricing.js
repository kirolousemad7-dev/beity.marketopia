/** @param {import('./types.js').Product} product */
export function productPrice(product) {
  const value = product.price_after_discount;
  const discounted = Number(value);
  return value !== null &&
    value !== undefined &&
    String(value).trim() !== "" &&
    Number.isFinite(discounted) &&
    discounted >= 0
    ? discounted
    : Number(product.price);
}
