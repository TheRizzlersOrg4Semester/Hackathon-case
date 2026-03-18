const ACCESS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeSupporterAccessCode(input: string): string {
  return input.trim().toUpperCase();
}

export function isSupporterAccessCodeFormatValid(input: string): boolean {
  return /^PF-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalizeSupporterAccessCode(input));
}

export function generateSupporterAccessCode(randomFloat: () => number = Math.random): string {
  const segment = () => {
    let value = "";

    for (let i = 0; i < 4; i += 1) {
      const idx = Math.floor(randomFloat() * ACCESS_CODE_ALPHABET.length) % ACCESS_CODE_ALPHABET.length;
      value += ACCESS_CODE_ALPHABET[idx];
    }

    return value;
  };

  return `PF-${segment()}-${segment()}`;
}
