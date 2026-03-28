pragma circom 2.0.0;

/**
 * AgeProof — prove you are >= minAge without revealing your actual age.
 *
 * Private inputs: age (the actual age, kept secret)
 * Public inputs:  minAge (the threshold being checked)
 * Output:         1 if age >= minAge, else circuit is unsatisfiable
 *
 * Compile:
 *   circom ageProof.circom --wasm --r1cs -o ../build/
 */
template AgeProof() {
  signal input age;        // private
  signal input minAge;     // public

  // Enforce age >= minAge
  // Uses a range check: (age - minAge) must be non-negative
  signal diff;
  diff <== age - minAge;

  // Assert diff is in range [0, 2^8) — enough for age checks up to 255
  component n2b = Num2Bits(8);
  n2b.in <== diff;
}

component main { public [minAge] } = AgeProof();
