export const parseExpiryToSeconds = (value: string): number => {
  const match = value.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error(`Invalid expiry format: ${value}. Use formats like 15m, 7d, 24h, 300s`);
  }

  const amount = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 60 * 60;
    case 'd':
      return amount * 24 * 60 * 60;
    default:
      throw new Error(`Unsupported expiry unit: ${unit}`);
  }
};

export const parseExpiryToMs = (value: string): number => {
  return parseExpiryToSeconds(value) * 1000;
};
