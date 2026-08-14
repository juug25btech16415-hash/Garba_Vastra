export const SHIPPING_FEE = 99
export const FREE_SHIPPING_THRESHOLD = 1999

export function calcShipping(subtotal) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
}
