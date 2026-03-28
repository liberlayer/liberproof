import { describe, it, expect } from "vitest";
import { secp256k1 } from "@noble/curves/secp256k1";
import { bytesToHex } from "@noble/hashes/utils";
import { signPayload, verifySignature } from "./signer.js";
import type { SignerConfig } from "./types.js";

function makeKeypair() {
  const privKey = secp256k1.utils.randomPrivateKey();
  const pubKey = secp256k1.getPublicKey(privKey, true);
  return {
    privateKey: bytesToHex(privKey),
    publicKey: bytesToHex(pubKey),
  };
}

describe("signPayload + verifySignature (secp256k1)", () => {
  it("produces a valid signature that verifies", () => {
    const { privateKey, publicKey } = makeKeypair();
    const config: SignerConfig = {
      privateKey,
      algorithm: "secp256k1",
      verificationMethod: "0xTestAddress",
    };
    const payload = new TextEncoder().encode("hello LiberProof");
    const proof = signPayload(payload, config);

    expect(proof.signature).toHaveLength(128); // 64 bytes compact → 128 hex chars
    expect(proof.payloadHash).toHaveLength(64);
    expect(proof.verificationMethod).toBe("0xTestAddress");
    expect(proof.algorithm).toBe("secp256k1");

    expect(verifySignature(proof, publicKey)).toBe(true);
  });

  it("fails verification with wrong public key", () => {
    const { privateKey } = makeKeypair();
    const { publicKey: wrongPub } = makeKeypair();
    const config: SignerConfig = {
      privateKey,
      algorithm: "secp256k1",
      verificationMethod: "0xTest",
    };
    const proof = signPayload(new TextEncoder().encode("data"), config);
    expect(verifySignature(proof, wrongPub)).toBe(false);
  });

  it("fails verification if signature is tampered", () => {
    const { privateKey, publicKey } = makeKeypair();
    const config: SignerConfig = { privateKey, algorithm: "secp256k1", verificationMethod: "0x" };
    const proof = signPayload(new TextEncoder().encode("data"), config);
    const tampered = { ...proof, signature: proof.signature.replace(/.$/, "0") };
    expect(verifySignature(tampered, publicKey)).toBe(false);
  });

  it("throws on unsupported algorithm", () => {
    const { privateKey } = makeKeypair();
    expect(() =>
      signPayload(new TextEncoder().encode("x"), {
        privateKey,
        algorithm: "secp256r1" as any,
        verificationMethod: "x",
      })
    ).toThrow("Unsupported algorithm");
  });
});
