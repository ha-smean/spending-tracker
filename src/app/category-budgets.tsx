"use client";

import { useState, useEffect, useMemo, use } from "react";
import type { Transaction } from "./models";
import { categories } from "./utils";
import { Input } from "@/components/ui/input";

interface BudgetMap {
  [category: string]: number;
}

interface CategoryBudgetsProps {
  monthlyTransactions: Transaction[];
  selectedMonth: number; // 0 = Jan
  categoryBudgets: BudgetMap;
}

export function CategoryBudgetDashboard({ monthlyTransactions, selectedMonth, categoryBudgets }: CategoryBudgetsProps) {
  const [budgets, setBudgets] = useState<BudgetMap>(categoryBudgets);

  useEffect(() => {
    setBudgets(categoryBudgets);
  }, [categoryBudgets]);

  // Save budgets whenever they change
  useEffect(() => {
    localStorage.setItem("categoryBudgets", JSON.stringify(budgets));
  }, [budgets]);

  const handleChange = (category: string, value: string) => {
    const num = parseFloat(value);
    setBudgets((prev) => ({ ...prev, [category]: isNaN(num) ? 0 : num }));
  };

  // Calculate spent per category for the selected month
  const spentPerCategory = useMemo(() => {
    const spent: Record<string, number> = {};
    monthlyTransactions.forEach((t) => {
      const month = new Date(t.date + "T00:00:00Z").getUTCMonth();
      if (month !== selectedMonth) return; // skip other months
      if (t.type === "expense") {
        spent[t.category] = (spent[t.category] || 0) + t.amount;
      } else if (t.type === "income") {
        spent[t.category] = (spent[t.category] || 0) - t.amount;
      }
    });

    // Round to 2 decimals
    for (const cat in spent) {
      spent[cat] = Math.round(spent[cat] * 100) / 100;
    }
    return spent;
  }, [monthlyTransactions, selectedMonth]);

  return (
    <div className="space-y-2 p-4">
      <h2 className="text-lg font-bold mb-4">Budget Overview</h2>
      <div className="grid grid-cols-2 gap-4">
        {categories
          .filter((cat) => cat.name !== "Jazmin Purchases")
          .map((cat) => {
            const budget = budgets[cat.name] ?? 0;
            const spent = spentPerCategory[cat.name] ?? 0;
            const remaining = Math.max(budget - spent, 0);
            const percentUsed = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
            const isOverBudget = spent > budget;

            return (
              <div key={cat.name} className="rounded-lg p-3 shadow-sm border ">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div style={{ backgroundColor: cat.color }} className="w-3 h-3 rounded-full" />
                    <span className="font-semibold text-sm">{cat.name}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      className="w-16  py-0 !border-none !bg-transparent  !focus-visible:ring-[0px] font-bold text-right !focus:outline-none !focus:ring-0"
                      placeholder="—"
                      value={budget || ""}
                      onChange={(e) => handleChange(cat.name, e.target.value)}
                    />
                  </div>
                </div>

                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percentUsed}%`,
                      backgroundColor: isOverBudget ? "#ef4444" : cat.color,
                    }}
                  />
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    ${spent.toFixed(2)} / ${budget.toFixed(2)}
                  </span>
                  <span className={isOverBudget ? "text-red-600 font-medium" : "text-green-600"}>
                    {isOverBudget ? `$${(spent - budget).toFixed(2)} over` : `$${remaining.toFixed(2)} left`}
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
