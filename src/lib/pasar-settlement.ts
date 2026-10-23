export function settlementAmounts(price: number, shipping: number, fee: number) {
  const sale = Number(price) + Number(shipping);
  return { sale, fee: -Number(fee), net: sale - Number(fee) };
}

export function providerAmountMatches(actual: number | undefined, expected: number): boolean {
  return Number.isSafeInteger(actual) && actual === expected;
}
