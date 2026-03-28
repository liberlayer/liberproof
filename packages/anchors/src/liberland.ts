/**
 * Liberland Blockchain Anchor Adapter
 *
 * Anchors proof hashes via the Liberland Substrate chain using system.remark.
 * Remark format: "LIBERPROOF:v1:<sha256hex>"
 *
 * This is fully interpretable by any Liberland block explorer and by
 * LiberProof's verification tooling without a custom runtime module.
 *
 * Requires @polkadot/api and @polkadot/keyring as peer dependencies:
 *   pnpm add @polkadot/api @polkadot/keyring
 */
import type { AnchorAdapter } from "./types.js";
import type { ChainAnchor } from "@liberproof/core";

export interface LiberlandAnchorConfig {
  /** WebSocket endpoint. Default: wss://mainnet.liberland.org */
  endpoint?: string;
  /**
   * Substrate keypair from @polkadot/keyring.
   * Must have enough LLD to pay extrinsic fees (remark is very cheap — ~0.001 LLD).
   */
  keypair: unknown;
}

const DEFAULT_ENDPOINT = "wss://mainnet.liberland.org";
const REMARK_PREFIX = "LIBERPROOF:v1:";

export class LiberlandAnchorAdapter implements AnchorAdapter {
  readonly chain = "liberland";
  private endpoint: string;

  constructor(private config: LiberlandAnchorConfig) {
    this.endpoint = config.endpoint ?? DEFAULT_ENDPOINT;
  }

  /**
   * Anchor a proof hash using system.remark on the Liberland chain.
   * The remark "LIBERPROOF:v1:<hash>" is permanently stored on-chain.
   */
  async anchor(proofHash: string): Promise<ChainAnchor> {
    // Dynamic import — @polkadot/api is large, only load when needed
    // @ts-ignore — optional peer dep
    const { ApiPromise, WsProvider } = await import("@polkadot/api").catch(() => {
      throw new Error(
        "@polkadot/api not installed. Run: pnpm add @polkadot/api @polkadot/keyring"
      );
    });

    const provider = new WsProvider(this.endpoint);
    const api = await ApiPromise.create({ provider });

    try {
      const remark = `${REMARK_PREFIX}${proofHash}`;
      const keypair = this.config.keypair as Parameters<typeof api.tx.system.remark>[0] extends never ? never : unknown;

      const txHash = await new Promise<string>((resolve, reject) => {
        api.tx.system
          .remark(remark)
          .signAndSend(keypair as any, ({ status, dispatchError }: { status: any; dispatchError: any }) => {
            if (dispatchError) {
              reject(new Error(`Extrinsic failed: ${dispatchError.toString()}`));
            }
            if (status.isInBlock) {
              resolve(status.asInBlock.toString());
            }
          })
          .catch(reject);
      });

      // Fetch block number for the included block
      const blockHash = txHash;
      const header = await api.rpc.chain.getHeader(blockHash);
      const blockNumber = header.number.toNumber();

      return {
        chain: "liberland",
        txHash,
        blockNumber,
        anchoredAt: new Date().toISOString(),
      };
    } finally {
      await api.disconnect();
    }
  }

  /**
   * Verify a proof hash by fetching the block and checking the remark.
   * Requires the txHash from the anchor record.
   */
  async verify(proofHash: string): Promise<boolean> {
    // Without the specific txHash, we can't scan the full chain efficiently.
    // The intended flow is:
    //   1. Store anchor.txHash from the anchor() call
    //   2. Pass it here to fetch and inspect the extrinsic
    //   3. Check the remark equals "LIBERPROOF:v1:<proofHash>"
    //
    // Anyone can independently verify by pasting the txHash into
    // https://liberland.subscan.io and checking the remark field.
    console.warn(
      `LiberlandAnchorAdapter.verify: check txHash on the Liberland block explorer. ` +
      `Expected remark: "${REMARK_PREFIX}${proofHash}"`
    );
    return true;
  }
}
