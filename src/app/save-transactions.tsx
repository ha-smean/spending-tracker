import { useState } from "react";
import type { Transaction } from "./models";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";


export default function SaveTransactions() {
  const [isLoading, setIsLoading] = useState(false);

  const handleExportCSV = () => {
    setIsLoading(true);
    try {
      const data = localStorage.getItem("transactions");
      console.log("data", data);
      if (!data) {
        alert("No transactions found");
        return;
      }

      const transactions: Transaction[] = JSON.parse(data);

      const csvHeaders = ["Authorized Date", "Description", "Amount", "Detailed Category"];
      const csvRows = transactions.map((row) => [
        row.date,
        row.description,
        `${row.type === "expense" ? "-" : ""}${row.amount}`,
        row.category,
      ]);

      const csv = [csvHeaders.join(","), ...csvRows.map((row) => row.join(","))].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `exported-transactions-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(`Export failed: ${error}`);
    } finally {
      toast.success("Transactions exported successfully");
      setIsLoading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={"ghost"} size={"icon-sm"} onClick={handleExportCSV} disabled={isLoading}
        className="text-muted-foreground hover:text-primary flex items-center gap-2">
          <FileDown className="" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Export all transactions</TooltipContent>
    </Tooltip>
  );
}
