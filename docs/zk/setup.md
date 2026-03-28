# ZK Circuit Setup

LiberProof uses circom 2.0 circuits compiled to WASM for in-browser
proof generation. snarkjs handles the prover and verifier.

## Prerequisites

```bash
# Install circom
cargo install --git https://github.com/iden3/circom

# Install snarkjs
pnpm add -g snarkjs
```

## Compile the age proof circuit

```bash
cd packages/zk/circuits

# Compile
circom ageProof.circom --wasm --r1cs --sym -o ../build/

# Powers of tau (use an existing ceremony for production)
snarkjs powersoftau new bn128 12 pot12_0.ptau
snarkjs powersoftau prepare phase2 pot12_0.ptau pot12_final.ptau

# Generate zkey
snarkjs groth16 setup ../build/ageProof.r1cs pot12_final.ptau ageProof_0.zkey
snarkjs zkey contribute ageProof_0.zkey ageProof_final.zkey --name="LiberProof v1"

# Export verification key
snarkjs zkey export verificationkey ageProof_final.zkey verification_key.json
```

## Generate a proof

```ts
import { generateProof } from "@liberproof/zk";

const proof = await generateProof({
  witness: { age: 25, minAge: 18 },
  wasmPath: "./build/ageProof_js/ageProof.wasm",
  zkeyPath: "./circuits/ageProof_final.zkey",
});

// publicSignals: ["1"] means age >= minAge proved ✓
```
