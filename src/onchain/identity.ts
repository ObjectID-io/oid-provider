import type { IotaClient } from "@iota/iota-sdk/client";
import axios from "axios";
import { dlvcProxyUrl } from "../onchain/config";

let _modP: Promise<any> | null = null;

async function getIdentityMod() {
  if (_modP) return _modP;
  _modP = import("@iota/identity-wasm/web");
  return _modP;
}
