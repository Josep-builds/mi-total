"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  costPerComprehendedUser,
  requiredLevyRate,
  usersFundable,
} from "@/lib/funderMath";

export type TokenAggregates = {
  sessions: number;
  pct_complete: number;
  pct_comprehension: number;
};

const MIN_SAMPLE_SIZE = 10;
const BAR_COLOR = "#0f766e";

function formatMXN(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  return `$${Math.round(amount).toLocaleString("es-MX")}`;
}

function formatUsers(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  return Math.round(amount).toLocaleString("es-MX");
}

function formatPercent(fraction: number): string {
  if (!Number.isFinite(fraction)) return "—";
  return `${(fraction * 100).toFixed(2)}%`;
}

export function FunderView({ aggregates }: { aggregates: TokenAggregates | null }) {
  const [costPerGatedUser, setCostPerGatedUser] = useState(200);
  const [levyPool, setLevyPool] = useState(300_000_000);
  const [revenueBase, setRevenueBase] = useState(6_811_000_000);
  const [usersTarget, setUsersTarget] = useState(1_000_000);

  const insufficientSample = !aggregates || aggregates.sessions < MIN_SAMPLE_SIZE;

  const costPerComprehended = insufficientSample
    ? null
    : costPerComprehendedUser(costPerGatedUser, aggregates.pct_comprehension);

  const fundable = costPerComprehended === null ? null : usersFundable(levyPool, costPerComprehended);

  const levyRate =
    costPerComprehended === null
      ? null
      : requiredLevyRate(usersTarget, costPerComprehended, revenueBase);

  const chartData =
    fundable === null
      ? []
      : [
          { label: "Financiables con el pool", users: Math.round(fundable) },
          { label: "Meta de usuarios", users: Math.round(usersTarget) },
        ];

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4 text-left">
      <p className="rounded-md bg-teal-50 p-3 text-sm text-teal-900">
        Vista del evaluador — solo datos agregados. Supuestos editables son estimaciones.
      </p>

      <div className="grid grid-cols-3 gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div>
          <p className="text-xs text-zinc-500">Sesiones</p>
          <p className="text-xl font-semibold text-zinc-900">
            {aggregates ? aggregates.sessions : 0}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">% panorama completo</p>
          <p className="text-xl font-semibold text-zinc-900">
            {insufficientSample ? "Muestra insuficiente" : `${aggregates.pct_complete}%`}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">% comprensión</p>
          <p className="text-xl font-semibold text-zinc-900">
            {insufficientSample ? "Muestra insuficiente" : `${aggregates.pct_comprehension}%`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-xl bg-white p-4 shadow-sm">
        <label className="flex flex-col text-sm text-zinc-600">
          Costo por usuario gateado (MXN)
          <input
            type="number"
            value={costPerGatedUser}
            onChange={(event) => setCostPerGatedUser(Number(event.target.value) || 0)}
            className="mt-1 rounded-md border border-zinc-300 px-2 py-1"
          />
        </label>
        <label className="flex flex-col text-sm text-zinc-600">
          Bolsa de la contribución (MXN)
          <input
            type="number"
            value={levyPool}
            onChange={(event) => setLevyPool(Number(event.target.value) || 0)}
            className="mt-1 rounded-md border border-zinc-300 px-2 py-1"
          />
        </label>
        <label className="flex flex-col text-sm text-zinc-600">
          Base de ingresos de prestamistas (MXN)
          <input
            type="number"
            value={revenueBase}
            onChange={(event) => setRevenueBase(Number(event.target.value) || 0)}
            className="mt-1 rounded-md border border-zinc-300 px-2 py-1"
          />
        </label>
        <label className="flex flex-col text-sm text-zinc-600">
          Meta de usuarios a financiar
          <input
            type="number"
            value={usersTarget}
            onChange={(event) => setUsersTarget(Number(event.target.value) || 0)}
            className="mt-1 rounded-md border border-zinc-300 px-2 py-1"
          />
        </label>
      </div>

      {insufficientSample ? (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Muestra insuficiente para calcular el costo por usuario comprendido (se
          necesitan al menos {MIN_SAMPLE_SIZE} sesiones).
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 rounded-xl bg-white p-4 shadow-sm">
            <div>
              <p className="text-xs text-zinc-500">Costo por usuario comprendido</p>
              <p className="text-lg font-semibold text-zinc-900">
                {formatMXN(costPerComprehended ?? NaN)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Usuarios financiables</p>
              <p className="text-lg font-semibold text-zinc-900">
                {formatUsers(fundable ?? NaN)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Tasa de contribución requerida</p>
              <p className="text-lg font-semibold text-zinc-900">
                {formatPercent(levyRate ?? NaN)}
              </p>
            </div>
          </div>

          <div className="h-56 rounded-xl bg-white p-4 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 16, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} stroke="#e4e4e7" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#52525b", fontSize: 12 }}
                  axisLine={{ stroke: "#d4d4d8" }}
                  tickLine={false}
                />
                <YAxis hide />
                <Bar dataKey="users" fill={BAR_COLOR} radius={[4, 4, 0, 0]} barSize={64}>
                  <LabelList
                    dataKey="users"
                    position="top"
                    formatter={(value) => formatUsers(Number(value))}
                    fill="#18181b"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <p className="rounded-md bg-zinc-100 p-3 text-xs text-zinc-600">
        Sunset a 12 meses: sin desviación medible, el proyecto se detiene o se
        rediseña.
      </p>
    </div>
  );
}
