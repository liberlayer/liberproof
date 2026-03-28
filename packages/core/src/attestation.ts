import { randomBytes, bytesToHex } from "@noble/hashes/utils";
import { signPayload, verifySignature } from "./signer.js";
import type { Attestation, SignerConfig, VerificationResult } from "./types.js";

export interface AttestationInput {
  issuer: string;
  subject: string;
  claim: Record<string, unknown>;
  expiresAt?: string;
}

/** Create a signed attestation. */
export function createAttestation(
  input: AttestationInput,
  signer: SignerConfig
): Attestation {
  const id = `urn:liberproof:attestation:${bytesToHex(randomBytes(16))}`;
  const issuedAt = new Date().toISOString();
  const payload = new TextEncoder().encode(
    JSON.stringify({ id, ...input, issuedAt })
  );
  return { id, ...input, issuedAt, proof: signPayload(payload, signer) };
}

/** Verify an attestation's signature and expiry. */
export function verifyAttestation(
  attestation: Attestation,
  publicKey: string
): VerificationResult {
  const verifiedAt = new Date().toISOString();
  if (attestation.expiresAt && new Date(attestation.expiresAt) < new Date()) {
    return { valid: false, reason: "Attestation has expired", verifiedAt };
  }
  const valid = verifySignature(attestation.proof, publicKey);
  return { valid, reason: valid ? undefined : "Invalid signature", verifiedAt };
}
