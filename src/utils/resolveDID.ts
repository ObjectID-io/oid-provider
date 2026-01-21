import { IdentityClientReadOnly, IotaDID } from "@iota/identity-wasm/web";
import { IotaClient } from "@iota/iota-sdk/client";

const debug = false;

export async function resolveDID(didDocObj: string, client: IotaClient, network: string) {
  try {
    let localNetwork = network;
    if (network === "mainnet") localNetwork = "iota";

    const identityClientReadOnly = await IdentityClientReadOnly.create(client);
    const iotaDid = IotaDID.fromObjectId(didDocObj, localNetwork);

    return await identityClientReadOnly.resolveDid(iotaDid);
  } catch (error) {
    if (debug) console.log(error);
  }
}
