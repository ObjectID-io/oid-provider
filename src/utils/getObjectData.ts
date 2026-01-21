// utils/objectUtils.ts (nuovo file o aggiungi dove ritieni opportuno)
import { IotaClient, getFullnodeUrl } from "@iota/iota-sdk/client";
import { getObject } from "./getObject";
import { ObjectData } from "../types/objectData";
const debug = false;

export async function getObjectData(client: IotaClient, network: string, oid: string): Promise<ObjectData | null> {
  try {
    const localNetwork = network === "testnet" ? "testnet" : "mainnet";

    const object = (await getObject(client, oid)) as any;

    if (object && object.content?.fields) {
      return {
        fields: object.content.fields,
        type: object.type,
        id: oid,
        network: localNetwork,
      };
    } else {
      console.warn(`Object ${oid} on network ${localNetwork} found, but content or fields are missing.`);
      return null;
    }
  } catch (error) {
    if (debug) console.error(`Error fetching or processing object ${oid} on network ${network}:`, error);
    return null;
  }
}
