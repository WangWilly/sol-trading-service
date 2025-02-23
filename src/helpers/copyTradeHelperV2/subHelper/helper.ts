import { SubIdTarPubkeyMap, RecordMap, CopyTradeRecord } from "../dtos";

////////////////////////////////////////////////////////////////////////////////

export class SubHelper {
  static getCopyTradeRecord(
    subId: number,
    copyTradeSubIdTarPubkeyMap: SubIdTarPubkeyMap,
    copyTradeRecordMap: RecordMap
  ): CopyTradeRecord | null {
    const targetPublicKey = copyTradeSubIdTarPubkeyMap.get(subId);
    if (!targetPublicKey) {
      return null;
    }
    const copyTradeRecord = copyTradeRecordMap.get(targetPublicKey);
    if (!copyTradeRecord) {
      return null;
    }

    return copyTradeRecord;
  }
}
