import type { DebtRow } from "./debtMath";

const STORAGE_KEY = "mi-total:debt-state";

export type StoredDebtState = {
  rows: DebtRow[];
  confirmedAllApps: boolean;
};

export function loadDebtState(): StoredDebtState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredDebtState> | null;
    if (!parsed || !Array.isArray(parsed.rows)) return null;

    return {
      rows: parsed.rows,
      confirmedAllApps: Boolean(parsed.confirmedAllApps),
    };
  } catch {
    return null;
  }
}

export function saveDebtState(state: StoredDebtState): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private mode, quota) — rows just won't persist across reloads.
  }
}
