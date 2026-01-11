# @objectid/objectid-provider (client-side)

This package exposes:
- A React Provider (`ObjectID`) that can auto-load ObjectID configuration from an on-chain config package
- A typed API wrapper around ObjectID Move calls (methods)

## React usage (auto config)

```tsx
import { ObjectID, useObjectIDSession, useObjectId } from "@objectid/objectid-provider/react";

function LoginButton() {
  const { connect, status, error, config } = useObjectIDSession();

  async function onLogin() {
    await connect({ network: "testnet", seed: "<64-hex-seed>", gasBudget: 10_000_000 });
  }

  return (
    <div>
      <button onClick={onLogin}>Connect</button>
      {status === "loading" && <div>Loading config…</div>}
      {error && <div>Error: {error}</div>}
      {config && <pre>{JSON.stringify({ source: config.source, objectId: config.objectId }, null, 2)}</pre>}
    </div>
  );
}

function App() {
  return (
    <ObjectID configPackageIds={{
      testnet: "0x...CONFIG_PKG_TESTNET",
      mainnet: "0x...CONFIG_PKG_MAINNET"
    }}>
      <LoginButton />
    </ObjectID>
  );
}
```

## Config discovery (no GraphQL)
The provider uses JSON-RPC only:
- it looks for a user-owned config object of type `<configPkg>::oid_config::Config`
- if not found, it discovers the shared default config object by querying the latest tx calling:
  `<configPkg>::oid_config::set_default_json`
  and extracting the mutated shared Config object id from `objectChanges`


## Windows note (npm install)
This package does not run `prepare` on install. Build it once with `npm run build` inside the SDK folder before consuming it via `file:`.
