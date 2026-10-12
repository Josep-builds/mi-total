import { describe, expect, it } from "vitest";
import {
  costPerComprehendedUser,
  requiredLevyRate,
  usersFundable,
} from "./funderMath";

describe("costPerComprehendedUser", () => {
  it("divides cost by the comprehension rate", () => {
    expect(costPerComprehendedUser(200, 50)).toBeCloseTo(400);
  });

  it("returns Infinity when the comprehension rate is zero", () => {
    expect(costPerComprehendedUser(200, 0)).toBe(Infinity);
  });
});

describe("usersFundable", () => {
  it("divides the levy pool by the cost per comprehended user", () => {
    expect(usersFundable(300_000_000, 400)).toBeCloseTo(750_000);
  });

  it("returns 0 when the cost per comprehended user is not finite or non-positive", () => {
    expect(usersFundable(300_000_000, Infinity)).toBe(0);
    expect(usersFundable(300_000_000, 0)).toBe(0);
  });
});

describe("requiredLevyRate", () => {
  it("computes the fraction of revenue needed to fund the target users", () => {
    expect(requiredLevyRate(1_000_000, 400, 6_811_000_000)).toBeCloseTo(
      (1_000_000 * 400) / 6_811_000_000,
    );
  });

  it("returns 0 when the revenue base is non-positive", () => {
    expect(requiredLevyRate(1_000_000, 400, 0)).toBe(0);
  });
});
