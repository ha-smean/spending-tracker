import { useMemo } from "react";
import { PieChart, Pie, Label } from "recharts";
import type { Category, Transaction } from "./models";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export function MonthlyCategoryPie({
  monthlyTransactions,
  categories,
}: {
  monthlyTransactions: Transaction[];
  categories: Category[];
}) {
  const pieData = useMemo(() => {
    const data = categories
      .map((cat) => {
        const totalRaw = monthlyTransactions
          .filter((t) => t.category === cat.name && t.type === "expense")
          // .filter((t) => t.category === cat.name && t.type === "expense" && cat.name !== "Jazmin Purchases")
          .reduce((sum, t) => sum + t.amount, 0);

        const total = Math.round(totalRaw * 100) / 100;
        return { name: cat.name, value: total, fill: cat.color };
      })
      .filter((d) => d.value > 0);

    return data.length > 0 ? data : [{ name: "No spending", value: 1, fill: "#e5e7eb" }];
  }, [monthlyTransactions, categories]);

  const totalIncome = monthlyTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = monthlyTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const netTotal = totalIncome - totalExpenses;

  return (
    <ChartContainer config={{}} className="aspect-square w-fit h-70">
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={95} outerRadius={125} paddingAngle={1}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                      ${netTotal.toLocaleString()}
                    </tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                      Total
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
