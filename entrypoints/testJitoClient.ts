import { JitoClient } from "../src/utils/3rdParties/jito";
import { safe } from "../src/utils/exceptions";
import { toSwapInfoDto } from "../src/utils/transactionHelper/toSwapInfo";
import { printSwapInfoDto } from "../src/utils/transactionHelper/dtos";

////////////////////////////////////////////////////////////////////////////////

async function main() {
  const client = new JitoClient();

  const resultRes = await client.getTipInfoV1();
  if (!resultRes) {
    console.error("Failed to get tip info");
    return;
  }
  console.log(resultRes);

}

main();
