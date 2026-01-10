# @objectid/objectid-provider

Client-side ObjectID SDK that executes Move calls directly using `@iota/iota-sdk`.
No backend required: methods correspond to the former Express routes (now transformed into API methods).

## Install (local)
```bash
npm i file:../objectid-client-provider-sdk
```

## React usage
```tsx
import { ObjectIdProvider, useObjectId } from "@objectid/objectid-provider/react";

function Root() {
  return (
    <ObjectIdProvider config={ network: "testnet", seed: "<64-hex-seed>" }>
      <App />
    </ObjectIdProvider>
  );
}

function Page() {
  const oid = useObjectId();
  // Example:
  // const r = await oid.create_object({ creditToken, OIDcontrollerCap, object_type, ... });
}
```

## Methods
- 40 tx methods auto-generated from your `routes.zip`
- `get_object({ objectId })`
- `get_objects({ after })`
- `document_did_string({ id })`

## Security
This design uses a raw seed in the browser. Do not use in production without a secure key management / wallet flow.
