export function costPerComprehendedUser(
  costPerGatedUser: number,
  comprehensionRatePercent: number,
): number {
  if (comprehensionRatePercent <= 0) return Infinity;
  return costPerGatedUser / (comprehensionRatePercent / 100);
}

export function usersFundable(levyPool: number, costPerComprehended: number): number {
  if (!Number.isFinite(costPerComprehended) || costPerComprehended <= 0) return 0;
  return levyPool / costPerComprehended;
}

export function requiredLevyRate(
  usersTarget: number,
  costPerComprehended: number,
  revenueBase: number,
): number {
  if (revenueBase <= 0 || !Number.isFinite(costPerComprehended)) return 0;
  return (usersTarget * costPerComprehended) / revenueBase;
}
