// import { Category, Product } from "./types";

// export const categories: Category[] = [
//   {
//     id: "cat-1",
//     name: "Coffee & Espresso",
//     slug: "coffee-espresso",
//     products: [
//       {
//         id: "p-1",
//         name: "Pro-Grind Espresso Machine",
//         slug: "pro-grind-espresso-machine",
//         stock: 14,
//         inStock: true,
//         price: "499.00",
//         description: "Commercial-grade extraction with integrated conical burr grinder."
//       }
//     ]
//   }
// ];

// export function getAllProducts(): Product[] {
//   return categories
//     .flatMap((cat) => cat.products ?? [])
//     .filter((product): product is Product => product !== undefined);
// }

// export function getProductBySlug(slug: string): Product | undefined {
//   return getAllProducts().find((product) => product.slug === slug);
// }

// export function getCategoryBySlug(slug: string): Category | undefined {
//   return categories.find((cat) => cat.slug === slug);
// }