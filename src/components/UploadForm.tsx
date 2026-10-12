"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  ALLOWED_TYPES,
  MAX_FILES,
  validateScreenshotFiles,
} from "@/lib/validateScreenshots";
import type { ExtractionResult } from "@/lib/extraction/core";

type Status = "idle" | "submitting" | "done";

export function UploadForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ExtractionResult | null>(null);

  function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    setStatus("idle");
    setResult(null);
    setFiles(selected);
    setErrors(validateScreenshotFiles(selected));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const clientErrors = validateScreenshotFiles(files);
    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }

    setStatus("submitting");
    setResult(null);

    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    const response = await fetch("/api/extract", {
      method: "POST",
      body: formData,
    });
    const body = await response.json();

    if (!response.ok) {
      setErrors(body.errors ?? [body.error ?? "No se pudo procesar las capturas."]);
      setStatus("idle");
      return;
    }

    setErrors([]);
    setResult(body as ExtractionResult);
    setStatus("done");
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4 text-left">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="screenshots" className="block text-sm font-medium text-zinc-900">
            Sube capturas de tus apps de préstamos (máx. {MAX_FILES})
          </label>
          <input
            id="screenshots"
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            multiple
            onChange={handleFilesChange}
            className="mt-2 block w-full text-sm text-zinc-700"
          />
        </div>

        <p className="text-sm text-zinc-500">
          Tus capturas no se guardan. Se leen y se borran.
        </p>

        {errors.length > 0 && (
          <ul className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}

        <button
          type="submit"
          disabled={files.length === 0 || status === "submitting"}
          className="rounded-full bg-teal-700 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
        >
          {status === "submitting" ? "Subiendo..." : "Subir capturas"}
        </button>
      </form>

      {result && result.ok && (
        <div className="flex flex-col gap-3">
          {result.simulated && (
            <p className="rounded-md bg-amber-100 p-3 text-center text-sm font-semibold text-amber-900">
              SALIDA DE IA SIMULADA
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {result.loans.map((loan, index) => (
              <li
                key={`${loan.lender}-${index}`}
                className="rounded-md border border-zinc-200 bg-white p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-900">{loan.lender}</span>
                  <span className="text-xs text-zinc-400">Extraído por IA — verifica</span>
                </div>
                <p className="text-zinc-600">
                  Saldo: ${loan.balance_mxn.toLocaleString("es-MX")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result && !result.ok && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          No pudimos leer tus capturas automáticamente. Vamos a capturar los datos a mano.
        </p>
      )}
    </div>
  );
}
