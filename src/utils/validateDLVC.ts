import {
  DomainLinkageConfiguration,
  EdDSAJwsVerifier,
  IotaDocument,
  JwtCredentialValidationOptions,
  JwtDomainLinkageValidator,
} from "@iota/identity-wasm/web";
import axios from "axios";

const debug = false;

export async function validate_dlvc(didDocument: IotaDocument, did: string) {
  const methods = didDocument.methods();
  for (const method of methods) {
    const DIDcontroller = method.controller().toUrl().toString();

    const network: "testnet" | "mainnet" = DIDcontroller.includes("testnet") ? "testnet" : "mainnet";

    const dlvcProxyUrl = "https://api.objectid.io/api/dlvc-proxy";

    if (DIDcontroller === did) {
      const serviceList = didDocument.service();
      for (const service of serviceList) {
        if (service.type().includes("LinkedDomains")) {
          const SE_DID_linked_URL = service.serviceEndpoint();

          let DID_linked_domain = "";

          if (typeof SE_DID_linked_URL === "string") {
            const url = new URL(SE_DID_linked_URL);
            DID_linked_domain = url.hostname;
          } else if (Array.isArray(SE_DID_linked_URL)) {
            // Prendi il primo elemento dell'array, se esiste
            const url = new URL(SE_DID_linked_URL[0]);
            DID_linked_domain = url.hostname;
          } else if (SE_DID_linked_URL instanceof Map) {
            // Recupera il primo valore della mappa
            const first = SE_DID_linked_URL.values().next().value;
            if (Array.isArray(first) && first.length > 0) {
              const url = new URL(first[0]);
              DID_linked_domain = url.hostname;
            }
          }

          DID_linked_domain = "https://" + DID_linked_domain.replace(/^www\./, "") + "/";
          const DID_linked_URL = service.serviceEndpoint().toString();

          /////////////////////////////
          // const configUrl = `${DID_linked_domain}.well-known/did-configuration.json?ts=${Date.now()}`;
          // const response = await axios.get(configUrl);
          /////////////////////////////

          const proxyRes = await axios.post(dlvcProxyUrl, {
            did: DIDcontroller,
            network,
          });

          const response = { data: proxyRes.data?.didConfiguration };

          if (response?.data?.linked_dids || Array.isArray(response.data.linked_dids)) {
            const [jwt] = response.data.linked_dids;

            if (!(typeof jwt !== "string" || jwt.split(".").length !== 3)) {
              const fetchedConfigurationResource = DomainLinkageConfiguration.fromJSON(response.data);

              try {
                new JwtDomainLinkageValidator(new EdDSAJwsVerifier()).validateLinkage(
                  didDocument,
                  fetchedConfigurationResource,
                  DID_linked_URL,
                  new JwtCredentialValidationOptions()
                );

                return true;
              } catch (error: unknown) {
                if (debug) console.log(error);
                return false;
              }
            }
          } else {
            return false;
          }
        }
      }
    }
  }
}
