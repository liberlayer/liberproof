/**
 * ZK Proof Generation
 *
 * Circuits are compiled separately using circom.
 * Run: circom circuits/ageProof.circom --wasm --r1cs -o build/
 * Then generate zkey: snarkjs groth16 setup build/ageProof.r1cs pot12_final.ptau circuits/ageProof.zkey
 *
 * See docs/zk/setup.md for full circuit setup guide.
 */
import type { ZKClaimInput, ZKProof } from "./types.js";

/**
 * Generate a ZK proof given a witness and compiled circuit.
 * Requires snarkjs as a peer dependency.
 */
export async function generateProof(input: ZKClaimInput): Promise<ZKProof> {
  // Dynamic import — snarkjs is large and only needed at proof generation time
  // @ts-ignore — snarkjs is an optional peer dep, types not required at build time
    const snarkjs = await import("snarkjs").catch(() => {
    throw new Error(
      "snarkjs not installed. Run: pnpm add snarkjs in @liberproof/zk"
    );
  });

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input.witness,
    input.wasmPath,
    input.zkeyPath
  );

  return { protocol: "groth16", proof, publicSignals };
}

/**
 * Verify a ZK proof against a verification key.
 */
export async function verifyProof(
  zkProof: ZKProof,
  vkeyPath: string
): Promise<boolean> {
  // @ts-ignore — snarkjs is an optional peer dep, types not required at build time
    const snarkjs = await import("snarkjs").catch(() => {
    throw new Error("snarkjs not installed.");
  });

  const vkey = await fetch(vkeyPath).then((r) => r.json());
  return snarkjs.groth16.verify(vkey, zkProof.publicSignals, zkProof.proof);
}
