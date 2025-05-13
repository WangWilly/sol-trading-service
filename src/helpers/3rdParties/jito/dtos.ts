import zod from "zod";

////////////////////////////////////////////////////////////////////////////////

// sendTransaction
// https://docs.jito.wtf/lowlatencytxnsend/#transactions-api-v1-transactions
export const SendTransactionV1ResultDtoSchema = zod.object({
  jsonrpc: zod.string(),
  result: zod.string(),
  id: zod.number(),
});

export type SendTransactionV1ResultDto = zod.infer<
  typeof SendTransactionV1ResultDtoSchema
>;

////////////////////////////////////////////////////////////////////////////////

// getTipInfo
// https://docs.jito.wtf/lowlatencytxnsend/#get-tip-information
export const GetTipInfoV1ResultDtoSchema = zod.array(
  zod.object({
    time: zod.string().transform((v) => new Date(v)),
    landed_tips_25th_percentile: zod.number(),
    landed_tips_50th_percentile: zod.number(),
    landed_tips_75th_percentile: zod.number(),
    landed_tips_95th_percentile: zod.number(),
    landed_tips_99th_percentile: zod.number(),
    ema_landed_tips_50th_percentile: zod.number(),
  }),
);

/**
 * _th_percentile -> sol
 */
export type GetTipInfoV1ResultDto = zod.infer<
  typeof GetTipInfoV1ResultDtoSchema
>;

export const GetPercentileTip = (
  tipInfo: GetTipInfoV1ResultDto,
  percentile: string,
): number => {
  return (tipInfo[0] as any)[percentile];
};
