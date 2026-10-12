import { z } from "zod";

export const LoanSchema = z.object({
  lender: z.string().min(1),
  balance_mxn: z.number().min(0).max(1_000_000),
  next_payment_mxn: z.number().min(0).max(1_000_000).nullable(),
  next_payment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  cat_percent: z.number().min(0).max(1000).nullable(),
});

export const ExtractionSchema = z.object({
  loans: z.array(LoanSchema).min(1),
  notes: z.string(),
});

export type Loan = z.infer<typeof LoanSchema>;

export type ExtractionSuccess = {
  ok: true;
  loans: Loan[];
  notes: string;
  simulated: boolean;
};

export type ExtractionFailure = {
  ok: false;
  error: "manual";
};

export type ExtractionResult = ExtractionSuccess | ExtractionFailure;

export const SIMULATED_LOANS: Loan[] = [
  {
    lender: "PagaYa",
    balance_mxn: 3200,
    next_payment_mxn: 800,
    next_payment_date: "2026-10-15",
    cat_percent: 180,
  },
  {
    lender: "Cuotix",
    balance_mxn: 2750,
    next_payment_mxn: 700,
    next_payment_date: "2026-10-15",
    cat_percent: null,
  },
  {
    lender: "PrestaFácil",
    balance_mxn: 2500,
    next_payment_mxn: 680,
    next_payment_date: "2026-10-15",
    cat_percent: 110,
  },
];

export function simulatedExtraction(): ExtractionSuccess {
  return {
    ok: true,
    loans: SIMULATED_LOANS,
    notes: "Datos de ejemplo (apps ficticias) — salida simulada.",
    simulated: true,
  };
}

function clampIfNumber(value: unknown): unknown {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(Math.max(value, 0), 1_000_000);
  }
  return value;
}

export function parseExtractionText(rawText: string): ExtractionResult {
  const start = rawText.indexOf("{");
  const end = rawText.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    return { ok: false, error: "manual" };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText.slice(start, end + 1));
  } catch {
    return { ok: false, error: "manual" };
  }

  if (
    typeof parsedJson !== "object" ||
    parsedJson === null ||
    !Array.isArray((parsedJson as { loans?: unknown }).loans)
  ) {
    return { ok: false, error: "manual" };
  }

  const candidate = parsedJson as {
    loans: Record<string, unknown>[];
    notes?: unknown;
  };

  const clampedLoans = candidate.loans.map((loan) => ({
    ...loan,
    balance_mxn: clampIfNumber(loan.balance_mxn),
    next_payment_mxn: clampIfNumber(loan.next_payment_mxn),
  }));

  const result = ExtractionSchema.safeParse({
    loans: clampedLoans,
    notes: typeof candidate.notes === "string" ? candidate.notes : "",
  });

  if (!result.success) {
    return { ok: false, error: "manual" };
  }

  return {
    ok: true,
    loans: result.data.loans,
    notes: result.data.notes,
    simulated: false,
  };
}

export async function runExtraction(options: {
  hasApiKey: boolean;
  forceSimulated: boolean;
  callGemini: () => Promise<string>;
}): Promise<ExtractionResult> {
  if (options.forceSimulated || !options.hasApiKey) {
    return simulatedExtraction();
  }

  let rawText: string;
  try {
    rawText = await options.callGemini();
  } catch {
    return simulatedExtraction();
  }

  return parseExtractionText(rawText);
}
