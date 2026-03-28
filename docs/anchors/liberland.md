# Liberland Blockchain Anchor Adapter

Anchors proof hashes on the Liberland substrate chain using `system.remark`
extrinsics. This is the native anchoring method for the LiberLayer ecosystem.

## Setup

```bash
pnpm add @polkadot/api @polkadot/keyring @liberproof/anchors
```

## Usage

```ts
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { LiberlandAnchorAdapter } from "@liberproof/anchors";

const api = await ApiPromise.create({ provider: new WsProvider("wss://mainnet.liberland.org") });
const keyring = new Keyring({ type: "sr25519" });
const keypair = keyring.addFromUri("//Alice");

const adapter = new LiberlandAnchorAdapter({ endpoint: "wss://mainnet.liberland.org", keypair });
const anchor = await adapter.anchor(record.proof.payloadHash);
```

## Remark format

`LIBERPROOF:v1:<sha256hex>`

This is interpretable by any Liberland block explorer and by LiberProof's
verification tooling without requiring a custom runtime module.
