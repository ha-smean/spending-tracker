"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Transaction } from "./models";

interface MonthlyComparisonProps {
  transactions: Transaction[];
  selectedMonth: number; // 0 = Jan, 11 = Dec
}

export function MonthlyComparison({ transactions, selectedMonth }: MonthlyComparisonProps) {
  // Aggregate net total per month
  const monthlyNetTotals = useMemo(() => {
    const totals: Record<number, number> = {};

    transactions.forEach((t) => {
      // Force UTC parse to avoid timezone issues
      const month = new Date(t.date + "T00:00:00Z").getUTCMonth(); // 0 = Jan, 11 = Dec

      if (!totals[month]) totals[month] = 0;

      if (t.type === "income") {
        totals[month] += t.amount;
      } else if (t.type === "expense") {
        totals[month] -= t.amount; // subtract expenses
      }
    });

    // Round to 2 decimals
    for (const month in totals) {
      totals[month] = Math.round(totals[month] * 100) / 100;
    }

    return totals;
  }, [transactions]);

  const currentNet = monthlyNetTotals[selectedMonth] || 0;
  const previousNet = monthlyNetTotals[selectedMonth - 1] || 0;

  const netChange = currentNet - previousNet;
  const netPercent = previousNet !== 0 ? (netChange / Math.abs(previousNet)) * 100 : 100;

  return (
    <div className="flex flex-col gap-1 text-sm">
      <div className="flex items-center gap-2 font-medium">
        Monthly breakdown{" "}
        {netChange > 0 ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : netChange < 0 ? (
          <TrendingDown className="h-4 w-4 text-red-500" />
        ) : null}
      </div>

      <div className="text-muted-foreground font-semibold">
        {previousNet !== 0 && netChange !== 0 && (
          <span className={`ml-2 ${netChange > 0 ? "text-green-500" : "text-red-500"}`}>
            {netChange > 0 ? "↑" : "↓"} ${Math.abs(netChange).toFixed(2)} (
            {Math.abs(netPercent).toFixed(1)}%)
          </span>
        )}
      </div>
    </div>
  );
}
