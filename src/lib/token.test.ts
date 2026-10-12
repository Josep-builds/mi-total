import { describe, expect, it } from "vitest";
import { signTokenPayload, TokenRequestSchema } from "./token";

describe("signTokenPayload", () => {
  const base = {
    userId: "user-1",
    issuedAt: "2026-10-12T10:00:00.000Z",
    pictureComplete: true,
    comprehensionPass: false,
    loansCount: 3,
  };

  it("is deterministic for the same input", () => {
    expect(signTokenPayload("secret", base)).toBe(signTokenPayload("secret", base));
  });

  it("changes when any field changes", () => {
    const a = signTokenPayload("secret", base);
    const b = signTokenPayload("secret", { ...base, loansCount: 4 });
    expect(a).not.toBe(b);
  });

  it("changes when the secret changes", () => {
    expect(signTokenPayload("secret-a", base)).not.toBe(signTokenPayload("secret-b", base));
  });
});

describe("TokenRequestSchema", () => {
  it("accepts a valid payload", () => {
    const result = TokenRequestSchema.safeParse({
      picture_complete: true,
      comprehension_pass: false,
      loans_count: 2,
    });
    expect(result.success).toBe(true);
  });

  it("rejects amounts or any field beyond the three allowed", () => {
    const result = TokenRequestSchema.safeParse({
      picture_complete: true,
      comprehension_pass: false,
      loans_count: 2,
      balance_mxn: 8450,
    });
    expect(result.success).toBe(false);
  });

  it("rejects loans_count outside 1-4", () => {
    const result = TokenRequestSchema.safeParse({
      picture_complete: true,
      comprehension_pass: true,
      loans_count: 5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing field", () => {
    const result = TokenRequestSchema.safeParse({
      picture_complete: true,
      loans_count: 2,
    });
    expect(result.success).toBe(false);
  });
});
