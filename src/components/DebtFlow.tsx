"use client";

import { useEffect, useState } from "react";
import { UploadForm } from "@/components/UploadForm";
import type { ExtractionResult } from "@/lib/extraction/core";
import {
  computeQuincenaDue,
  computeTotal,
  computeYearlyCost,
  isPictureIncomplete,
  type DebtRow,
} from "@/lib/debtMath";
import { loadDebtState, saveDebtState } from "@/lib/localDebtStorage";

let rowIdCounter = 0;
function nextRowId(): string {
  rowIdCounter += 1;
  return `row-${Date.now()}-${rowIdCounter}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatMXN(amount: number): string {
  return `$${Math.round(amount).toLocaleString("es-MX")}`;
}

export function DebtFlow() {
  const [hydrated, setHydrated] = useState(false);
  const [rows, setRows] = useState<DebtRow[]>([]);
  const [confirmedAllApps, setConfirmedAllApps] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);

  useEffect(() => {
    const stored = loadDebtState();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       localStorage on mount; must run after mount so SSR and the first client
       render match before the stored rows (if any) are applied. */
    if (stored) {
      setRows(stored.rows);
      setConfirmedAllApps(stored.confirmedAllApps);
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveDebtState({ rows, confirmedAllApps });
  }, [hydrated, rows, confirmedAllApps]);

  function handleExtracted(result: ExtractionResult) {
    if (result.ok) {
      setManualEntry(false);
      setSimulated(result.simulated);
      setRows(
        result.loans.map((loan) => ({
          id: nextRowId(),
          lender: loan.lender,
          balance_mxn: loan.balance_mxn,
          next_payment_mxn: loan.next_payment_mxn,
          next_payment_date: loan.next_payment_date,
          cat_percent: loan.cat_percent,
          source: "ai" as const,
        })),
      );
    } else {
      setManualEntry(true);
      setRows([]);
    }
  }

  function updateRow(id: string, patch: Partial<DebtRow>) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function deleteRow(id: string) {
    setRows((current) => current.filter((row) => row.id !== id));
  }

  function addRow() {
    setRows((current) => [
      ...current,
      {
        id: nextRowId(),
        lender: "",
        balance_mxn: 0,
        next_payment_mxn: null,
        next_payment_date: null,
        cat_percent: null,
        source: "manual",
      },
    ]);
  }

  if (!hydrated) {
    return null;
  }

  const showUpload = rows.length === 0 && !manualEntry;

  if (showUpload) {
    return <UploadForm onResult={handleExtracted} />;
  }

  const total = computeTotal(rows);
  const quincena = computeQuincenaDue(rows, todayIso());
  const yearly = computeYearlyCost(rows);
  const incomplete = isPictureIncomplete(rows, confirmedAllApps);

  return (
    <div className="flex w-full max-w-md flex-col gap-4 text-left">
      {simulated && (
        <p className="rounded-md bg-amber-100 p-3 text-center text-sm font-semibold text-amber-900">
          SALIDA DE IA SIMULADA
        </p>
      )}

      {manualEntry && rows.length === 0 && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          No pudimos leer tus capturas automáticamente. Agrega tus datos a mano.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.id} className="rounded-md border border-zinc-200 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <input
                value={row.lender}
                onChange={(event) => updateRow(row.id, { lender: event.target.value })}
                placeholder="Nombre de la app"
                className="flex-1 border-b border-zinc-200 text-sm font-medium text-zinc-900"
              />
              {row.source === "ai" && (
                <span className="whitespace-nowrap text-xs text-zinc-400">
                  Extraído por IA — verifica
                </span>
              )}
              <button
                type="button"
                onClick={() => deleteRow(row.id)}
                className="whitespace-nowrap text-xs text-red-600"
              >
                Eliminar
              </button>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <label className="flex flex-col text-zinc-500">
                Saldo (MXN)
                <input
                  type="number"
                  value={row.balance_mxn}
                  onChange={(event) =>
                    updateRow(row.id, { balance_mxn: Number(event.target.value) || 0 })
                  }
                  className="border-b border-zinc-200"
                />
              </label>
              <label className="flex flex-col text-zinc-500">
                Próximo pago (MXN)
                <input
                  type="number"
                  value={row.next_payment_mxn ?? ""}
                  onChange={(event) =>
                    updateRow(row.id, {
                      next_payment_mxn:
                        event.target.value === "" ? null : Number(event.target.value),
                    })
                  }
                  className="border-b border-zinc-200"
                />
              </label>
              <label className="flex flex-col text-zinc-500">
                Fecha próximo pago
                <input
                  type="date"
                  value={row.next_payment_date ?? ""}
                  onChange={(event) =>
                    updateRow(row.id, {
                      next_payment_date: event.target.value === "" ? null : event.target.value,
                    })
                  }
                  className="border-b border-zinc-200"
                />
              </label>
              <label className="flex flex-col text-zinc-500">
                CAT (%)
                <input
                  type="number"
                  value={row.cat_percent ?? ""}
                  onChange={(event) =>
                    updateRow(row.id, {
                      cat_percent: event.target.value === "" ? null : Number(event.target.value),
                    })
                  }
                  className="border-b border-zinc-200"
                />
              </label>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={addRow}
        className="text-sm font-medium text-teal-700 underline"
      >
        Agregar otra app
      </button>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={confirmedAllApps}
          onChange={(event) => setConfirmedAllApps(event.target.checked)}
        />
        Incluí todas mis apps de préstamos
      </label>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm text-zinc-500">en {rows.length} apps</p>
        <p className="text-3xl font-bold text-zinc-900">Debes {formatMXN(total)} en total</p>
        <p className="mt-2 text-sm text-zinc-600">
          Esta quincena pagas {formatMXN(quincena)}
        </p>
        <p className="text-sm text-zinc-600">
          Al año te cuesta ≈{" "}
          {yearly.hasUnknown ? "desconocido" : formatMXN(yearly.amount)} en intereses y
          comisiones
        </p>
        <p className="mt-2 text-xs text-zinc-400">
          Cálculo aproximado — verifica con tu contrato.
        </p>
      </div>

      {incomplete && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Puede faltar información. Este total podría ser mayor.
        </p>
      )}
    </div>
  );
}
