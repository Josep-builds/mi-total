export type DebtRow = {
  id: string;
  lender: string;
  balance_mxn: number;
  next_payment_mxn: number | null;
  next_payment_date: string | null;
  cat_percent: number | null;
  source: "ai" | "manual";
};

export function computeTotal(rows: DebtRow[]): number {
  return rows.reduce((sum, row) => sum + row.balance_mxn, 0);
}

export function computeQuincenaDue(rows: DebtRow[], todayIso: string): number {
  const limit = addDays(todayIso, 15);
  return rows.reduce((sum, row) => {
    if (row.next_payment_date === null || row.next_payment_mxn === null) {
      return sum;
    }
    if (row.next_payment_date > limit) {
      return sum;
    }
    return sum + row.next_payment_mxn;
  }, 0);
}

export function computeYearlyCost(rows: DebtRow[]): {
  amount: number;
  hasUnknown: boolean;
} {
  let amount = 0;
  let hasUnknown = false;

  for (const row of rows) {
    if (row.cat_percent === null) {
      hasUnknown = true;
      continue;
    }
    amount += row.balance_mxn * (row.cat_percent / 100);
  }

  return { amount, hasUnknown };
}

export function isPictureIncomplete(
  rows: DebtRow[],
  confirmedAllApps: boolean,
): boolean {
  if (!confirmedAllApps) return true;
  return rows.some(
    (row) => row.cat_percent === null || row.next_payment_date === null,
  );
}

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
