import { randomBytes, bytesToHex } from "@noble/hashes/utils";
import { hashBytes } from "./hash.js";
import { signPayload } from "./signer.js";
import type { NotarizationRecord, SignerConfig } from "./types.js";

export interface NotarizationInput {
  data: Uint8Array;
  mimeType: string;
  label?: string;
}

/**
 * Notarize a document — hash it, timestamp it, sign it.
 * Chain anchoring is handled by the @liberproof/anchors package.
 */
export function notarizeDocument(
  input: NotarizationInput,
  signer: SignerConfig
): NotarizationRecord {
  const id = `urn:liberproof:notarization:${bytesToHex(randomBytes(16))}`;
  const documentHash = hashBytes(input.data);
  const timestamp = new Date().toISOString();
  const payload = new TextEncoder().encode(
    JSON.stringify({ id, documentHash, mimeType: input.mimeType, timestamp, label: input.label })
  );
  return { id, documentHash, mimeType: input.mimeType, timestamp, label: input.label, proof: signPayload(payload, signer) };
}
