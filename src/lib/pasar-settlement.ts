// Satu sumber biaya rekber — jangan duplikat angkanya di renderer/handler.
export const PASAR_FEE = 5000; // owner-approved 2026-10-18

export function settlementAmounts(price: number, shipping: number, fee: number) {
  const sale = Number(price) + Number(shipping);
  return { sale, fee: -Number(fee), net: sale - Number(fee) };
}

export function providerAmountMatches(actual: number | undefined, expected: number): boolean {
  return Number.isSafeInteger(actual) && actual === expected;
}
