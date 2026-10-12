"use client";

import { useState, type FormEvent } from "react";

type Phase = "ask" | "reveal";

export function ComprehensionStep({
  totalLabel,
  quincenaLabel,
  yearlyLabel,
  total,
  incomplete,
  pictureComplete,
  loansCount,
  onFinished,
}: {
  totalLabel: string;
  quincenaLabel: string;
  yearlyLabel: string;
  total: number;
  incomplete: boolean;
  pictureComplete: boolean;
  loansCount: number;
  onFinished: (tokenId: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("ask");
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAnswerSubmit(event: FormEvent) {
    event.preventDefault();
    if (answer.trim() === "" || Number.isNaN(Number(answer))) {
      setError("Escribe un número.");
      return;
    }
    setError(null);
    setPhase("reveal");
  }

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);

    const comprehensionPass = Math.abs(Number(answer) - total) <= total * 0.1;

    const response = await fetch("/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        picture_complete: pictureComplete,
        comprehension_pass: comprehensionPass,
        loans_count: loansCount,
      }),
    });
    const body = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError("No se pudo guardar tu confirmación. Intenta de nuevo.");
      return;
    }

    onFinished(body.tokenId as string);
  }

  if (phase === "ask") {
    return (
      <form
        onSubmit={handleAnswerSubmit}
        className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm"
      >
        <label className="text-sm font-medium text-zinc-900">
          Sin ver arriba, ¿cuánto debes en total?
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          placeholder="$"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="rounded-full bg-teal-700 px-6 py-3 text-base font-medium text-white hover:bg-teal-800"
        >
          Ver mi total
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm">
      <p className="text-sm text-zinc-500">{quincenaLabel}</p>
      <p className="text-3xl font-bold text-zinc-900">{totalLabel}</p>
      <p className="text-sm text-zinc-600">{yearlyLabel}</p>
      {incomplete && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Puede faltar información. Este total podría ser mayor.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        disabled={submitting}
        onClick={handleConfirm}
        className="rounded-full bg-teal-700 px-6 py-3 text-base font-medium text-white hover:bg-teal-800 disabled:opacity-50"
      >
        {submitting ? "Guardando..." : "Entendido, sigo"}
      </button>
    </div>
  );
}
