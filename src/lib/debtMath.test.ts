import { describe, expect, it } from "vitest";
import {
  computeQuincenaDue,
  computeTotal,
  computeYearlyCost,
  isPictureIncomplete,
  type DebtRow,
} from "./debtMath";

const TODAY = "2026-10-12";

describe("debt math — case 1: complete picture, matches the mockup numbers", () => {
  const rows: DebtRow[] = [
    {
      id: "1",
      lender: "PagaYa",
      balance_mxn: 3200,
      next_payment_mxn: 800,
      next_payment_date: "2026-10-15",
      cat_percent: 180,
      source: "ai",
    },
    {
      id: "2",
      lender: "Cuotix",
      balance_mxn: 2750,
      next_payment_mxn: 700,
      next_payment_date: "2026-10-20",
      cat_percent: 90,
      source: "ai",
    },
    {
      id: "3",
      lender: "PrestaFácil",
      balance_mxn: 2500,
      next_payment_mxn: 680,
      next_payment_date: "2026-11-01",
      cat_percent: 110,
      source: "ai",
    },
  ];

  it("totals all balances regardless of date", () => {
    expect(computeTotal(rows)).toBe(8450);
  });

  it("sums only payments due within the next 15 days", () => {
    // limit is 2026-10-27: PagaYa (10-15) and Cuotix (10-20) qualify, PrestaFácil (11-01) does not.
    expect(computeQuincenaDue(rows, TODAY)).toBe(1500);
  });

  it("computes the yearly cost from CAT when every row has one", () => {
    const yearly = computeYearlyCost(rows);
    expect(yearly.hasUnknown).toBe(false);
    expect(yearly.amount).toBeCloseTo(3200 * 1.8 + 2750 * 0.9 + 2500 * 1.1);
  });

  it("is complete when every row has CAT and date and the user confirmed the list", () => {
    expect(isPictureIncomplete(rows, true)).toBe(false);
  });
});

describe("debt math — case 2: missing CAT on one row", () => {
  const rows: DebtRow[] = [
    {
      id: "1",
      lender: "PagaYa",
      balance_mxn: 3200,
      next_payment_mxn: 800,
      next_payment_date: "2026-10-15",
      cat_percent: 180,
      source: "ai",
    },
    {
      id: "2",
      lender: "Cuotix",
      balance_mxn: 2750,
      next_payment_mxn: 700,
      next_payment_date: "2026-10-20",
      cat_percent: null,
      source: "ai",
    },
  ];

  it("flags the yearly cost as partially unknown and excludes that row from the sum", () => {
    const yearly = computeYearlyCost(rows);
    expect(yearly.hasUnknown).toBe(true);
    expect(yearly.amount).toBeCloseTo(3200 * 1.8);
  });

  it("marks the picture incomplete even if the user confirmed the list", () => {
    expect(isPictureIncomplete(rows, true)).toBe(true);
  });
});

describe("debt math — case 3: missing payment date and unconfirmed list", () => {
  const rows: DebtRow[] = [
    {
      id: "1",
      lender: "PrestaFácil",
      balance_mxn: 2500,
      next_payment_mxn: 680,
      next_payment_date: null,
      cat_percent: 110,
      source: "manual",
    },
  ];

  it("excludes rows with no date from the quincena sum", () => {
    expect(computeQuincenaDue(rows, TODAY)).toBe(0);
  });

  it("is incomplete both for the missing date and for not confirming the list", () => {
    expect(isPictureIncomplete(rows, false)).toBe(true);
  });
});
