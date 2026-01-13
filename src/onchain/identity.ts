import type { IotaClient } from "@iota/iota-sdk/client";

/**
 * Resolves an IOTA DID from its AliasId (DID Document object id).
 *
 * - didDocObj: Alias object id (hex object id) backing the DID.
 * - network: "testnet" | "mainnet"
 *
 * Note: identity-wasm expects "iota" as the mainnet name.
 */
export async function resolveDID(didDocObj: string, client: IotaClient, network: string): Promise<any> {
  const localNetwork = network === "mainnet" ? "iota" : network;

  // Lazy import to keep bundle smaller and avoid loading wasm until needed.
  const { IdentityClientReadOnly, IotaDID } = await import("@iota/identity-wasm/web");

  const identityClientReadOnly = await IdentityClientReadOnly.create(client as any);
  const iotaDid = IotaDID.fromAliasId(didDocObj, localNetwork);

  return await identityClientReadOnly.resolveDid(iotaDid);
}
