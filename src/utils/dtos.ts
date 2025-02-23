////////////////////////////////////////////////////////////////////////////////

export interface ComputeBudgetInfo {
  unitPriceMicroLamports: number | bigint | undefined; // FIXME: why undefined?
  unitsLimit: number;
};
