import type { ChainAnchor } from "@liberproof/core";

/** Common interface every anchor adapter must implement */
export interface AnchorAdapter {
  readonly chain: string;
  /** Submit a proof hash on-chain. Returns the anchor record. */
  anchor(proofHash: string): Promise<ChainAnchor>;
  /** Check if a proof hash is anchored on-chain. */
  verify(proofHash: string): Promise<boolean>;
}
