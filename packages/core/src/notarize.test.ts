import { describe, it, expect, beforeAll } from "vitest";
import { secp256k1 } from "@noble/curves/secp256k1";
import { bytesToHex } from "@noble/hashes/utils";
import { notarizeDocument } from "./notarize.js";
import { hashBytes } from "./hash.js";
import type { SignerConfig } from "./types.js";

let signerConfig: SignerConfig;

beforeAll(() => {
  const privKey = secp256k1.utils.randomPrivateKey();
  signerConfig = {
    privateKey: bytesToHex(privKey),
    algorithm: "secp256k1",
    verificationMethod: "0xNotary",
  };
});

describe("notarizeDocument", () => {
  it("returns a record with correct documentHash", () => {
    const data = new TextEncoder().encode("important contract text");
    const record = notarizeDocument({ data, mimeType: "text/plain", label: "Test" }, signerConfig);

    expect(record.documentHash).toBe(hashBytes(data));
    expect(record.id).toMatch(/^urn:liberproof:notarization:/);
    expect(record.mimeType).toBe("text/plain");
    expect(record.label).toBe("Test");
    expect(record.proof).toBeDefined();
    expect(record.anchor).toBeUndefined();
  });

  it("generates unique IDs for the same document", () => {
    const data = new TextEncoder().encode("same content");
    const r1 = notarizeDocument({ data, mimeType: "text/plain" }, signerConfig);
    const r2 = notarizeDocument({ data, mimeType: "text/plain" }, signerConfig);
    expect(r1.id).not.toBe(r2.id);
  });

  it("has a recent timestamp", () => {
    const data = new TextEncoder().encode("ts test");
    const before = Date.now();
    const record = notarizeDocument({ data, mimeType: "text/plain" }, signerConfig);
    const after = Date.now();
    const ts = new Date(record.timestamp).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});
