import { describe, expect, it } from "vitest";
import { parseExtractionText, runExtraction } from "./core";

describe("parseExtractionText", () => {
  it("accepts a valid JSON payload", () => {
    const text = JSON.stringify({
      loans: [
        {
          lender: "PagaYa",
          balance_mxn: 3200,
          next_payment_mxn: 800,
          next_payment_date: "2026-10-15",
          cat_percent: 180,
        },
      ],
      notes: "ok",
    });

    const result = parseExtractionText(text);
    expect(result.ok).toBe(true);
  });

  it("clamps out-of-range amounts instead of rejecting them", () => {
    const text = JSON.stringify({
      loans: [
        {
          lender: "PagaYa",
          balance_mxn: 50_000_000,
          next_payment_mxn: -100,
          next_payment_date: null,
          cat_percent: null,
        },
      ],
      notes: "",
    });

    const result = parseExtractionText(text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.loans[0].balance_mxn).toBe(1_000_000);
      expect(result.loans[0].next_payment_mxn).toBe(0);
    }
  });

  it("falls back to manual entry on malformed JSON", () => {
    const result = parseExtractionText("not json at all");
    expect(result).toEqual({ ok: false, error: "manual" });
  });

  it("falls back to manual entry when a required field is missing", () => {
    const text = JSON.stringify({ loans: [{ lender: "PagaYa" }], notes: "" });
    const result = parseExtractionText(text);
    expect(result).toEqual({ ok: false, error: "manual" });
  });

  it("extracts JSON even when wrapped in markdown fences", () => {
    const text =
      "```json\n" +
      JSON.stringify({
        loans: [
          {
            lender: "Cuotix",
            balance_mxn: 2750,
            next_payment_mxn: null,
            next_payment_date: null,
            cat_percent: null,
          },
        ],
        notes: "",
      }) +
      "\n```";

    const result = parseExtractionText(text);
    expect(result.ok).toBe(true);
  });
});

describe("runExtraction", () => {
  it("returns the simulated fixture when there is no API key", async () => {
    const result = await runExtraction({
      hasApiKey: false,
      forceSimulated: false,
      callGemini: async () => "should not be called",
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.simulated).toBe(true);
  });

  it("returns the simulated fixture when USE_SIMULATED_AI forces it", async () => {
    const result = await runExtraction({
      hasApiKey: true,
      forceSimulated: true,
      callGemini: async () => "should not be called",
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.simulated).toBe(true);
  });

  it("falls back to simulated output when the Gemini call throws", async () => {
    const result = await runExtraction({
      hasApiKey: true,
      forceSimulated: false,
      callGemini: async () => {
        throw new Error("quota exceeded");
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.simulated).toBe(true);
  });

  it("parses a real Gemini response when the key is present", async () => {
    const text = JSON.stringify({
      loans: [
        {
          lender: "PrestaFácil",
          balance_mxn: 2500,
          next_payment_mxn: 680,
          next_payment_date: "2026-10-15",
          cat_percent: 110,
        },
      ],
      notes: "",
    });

    const result = await runExtraction({
      hasApiKey: true,
      forceSimulated: false,
      callGemini: async () => text,
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.simulated).toBe(false);
  });
});
