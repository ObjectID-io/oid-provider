import init from "@iota/identity-wasm/web/identity_wasm.js";
import wasmUrl from "@iota/identity-wasm/web/identity_wasm_bg.wasm?url";
import { IotaClient } from "@iota/iota-sdk/client";

let ready: Promise<void> | null = null;

export function initIdentityWasm(): Promise<void> {
  if (!ready) {
    ready = init({ module_or_path: wasmUrl }).then(() => {});
  }
  return ready;
}

let _modP: Promise<any> | null = null;

async function getIdentityMod() {
  if (_modP) return _modP;
  _modP = import("@iota/identity-wasm/web");
  return _modP;
}

export async function validateDid(client: IotaClient, network: string, didObject: any) {
  try {
    const mod: any = await getIdentityMod();

    const { IdentityClientReadOnly, IotaDID } = mod;

    const identityClientReadOnly = await IdentityClientReadOnly.create(client as any);

    const iotaDid =
      network !== "mainnet" ? IotaDID.fromAliasId(didObject, network) : IotaDID.fromAliasId(didObject, "iota");

    const didDocument = await identityClientReadOnly.resolveDid(iotaDid);

    return { success: true, message: "DID resolved", didDocument };
  } catch (error: any) {
    return { success: false, message: error?.message ?? String(error), didDocument: "" };
  }
}
