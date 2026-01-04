import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Transaction } from "./models";
import { categories, categorizeTransaction, isAmbiguous, loadLS, months, shouldIgnoreTransaction } from "./utils";
import { MonthlyCategoryPie } from "./monthly-spending-pie";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ThemeSelector from "@/components/theme-selector";
import { CategoryBudgetDashboard } from "./category-budgets";
import { TransactionsTable } from "./transactions-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadLS("transactions", []));
  const [reviewQueue, setReviewQueue] = useState<Transaction[]>(() => loadLS("reviewQueue", []));
  const [reviewing, setReviewing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [showClearDialog, setShowClearDialog] = useState(false);

  // filter transactions for the selected month
  const monthlyTransactions = useMemo(
    () =>
      transactions.filter((t) => {
        const date = new Date(t.date + "T00:00:00");
        return date.getMonth() === selectedMonth;
      }),
    [transactions, selectedMonth]
  );

  // local storage sync
  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);
  useEffect(() => {
    localStorage.setItem("reviewQueue", JSON.stringify(reviewQueue));
  }, [reviewQueue]);
  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(categories));
  }, [categories]);

  // CSV upload and parsing
  function handleCSV(file: File) {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const clean: Transaction[] = [];
        const needsReview: Transaction[] = [];

        results.data.forEach((row: any) => {
          const rawAmount = Number(row["Amount"]);
          if (isNaN(rawAmount)) return;
          if (shouldIgnoreTransaction(row["Description"], row["Detailed Category"])) return;

          const description = `${(row["Description"] || "").trim()} ${(row["Detailed Category"] || "").trim()} ${(
            row["Primary Category"] || ""
          ).trim()}`.trim();
          const isExpense = rawAmount < 0;

          const keywordCategory = categorizeTransaction(description);

          const tx: Transaction = {
            id: crypto.randomUUID(),
            date: row["Authorized Date"],
            description: row["Description"],
            amount: Math.abs(rawAmount),
            type: isExpense ? "expense" : "income",
            category: keywordCategory !== "Uncategorized" ? keywordCategory : row["Detailed Category"],
          };

          if (isExpense && isAmbiguous(description) && keywordCategory === "Uncategorized") {
            needsReview.push({ ...tx });
            clean.push({ ...tx, category: "Needs Review" });
          } else {
            clean.push(tx);
          }
        });

        setTransactions((prev) => [...prev, ...clean]);
        setReviewQueue((prev) => [...prev, ...needsReview]);
        if (needsReview.length > 0) setReviewing(true);
      },
    });
  }

  // review logic
  function resolve(tx: Transaction, category: string) {
    setTransactions((prev) => [...prev, { ...tx, category }]);
    setReviewQueue((prev) => prev.filter((t) => t.id !== tx.id));
  }

  const current = reviewQueue[0];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="flex justify-between text-2xl font-bold">Spending Tracker <ThemeSelector /></h1>
      

      <div className="grid w-full max-w-sm items-center gap-3">
        <Input
          type="file"
          onChange={(e) => e.target.files && handleCSV(e.target.files[0])}
        />
      </div>

      {reviewing && current && (
        <Dialog open={reviewing} onOpenChange={setReviewing}>
          <DialogContent className="w-full max-w-md">
            <DialogHeader>
              <DialogTitle>Review Transaction</DialogTitle>
            </DialogHeader>
            <div className="text-sm space-y-4">
              <div className="space-y-1">
                <div>
                  <strong>Date:</strong> {current.date}
                </div>
                <div>
                  <strong>Description:</strong> {current.description}
                </div>
                <div>
                  <strong>Amount:</strong> ${current.amount.toFixed(2)}
                </div>
              </div>
              <Select key={current.id} value="" onValueChange={(value) => resolve(current, value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.name} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="w-full" onClick={() => setReviewing(false)}>
                Finish Later
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {reviewQueue.length > 0 && monthlyTransactions.length > 0 && (
        <div className="flex gap-1">
          <Button
            className="flex-1 bg-yellow-500 hover:bg-yellow-500/90 font-semibold cursor-pointer"
            onClick={() => setReviewing(true)}
          >
            <AlertCircle className="h-4 w-4" />
            {reviewQueue.length} transactions need review
          </Button>
        </div>
      )}
      {/* <Card className="p-4">
        <CardHeader>
          <CardTitle>Category Budgets</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryBudgetDashboard monthlyTransactions={monthlyTransactions} selectedMonth={selectedMonth} />
        </CardContent>
      </Card> */}

      {/* Pie Chart with shadcn Card */}
      <Card className="flex flex-col">
        <CardHeader className="pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Spending by Category</CardTitle>

          {/* Month Select */}
          <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
            <SelectTrigger className="w-32 mt-2 sm:mt-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className="flex-1 flex items-center justify-center">
          <MonthlyCategoryPie monthlyTransactions={monthlyTransactions} categories={categories} />
        </CardContent>

        <CardFooter className="flex-col gap-2 text-sm">
          {/* <MonthlyComparison transactions={transactions} selectedMonth={selectedMonth} /> */}
        </CardFooter>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <TransactionsTable
            monthlyTransactions={monthlyTransactions}
            onTransactionUpdate={(updatedTransaction) => {
              setTransactions((prev) => prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t)));
            }}
          />{" "}
        </CardContent>
      </Card>
      <div>
        <>
          <Button className="cursor-pointer" variant={"destructive"} size="sm" onClick={() => setShowClearDialog(true)}>
            Clear local storage
          </Button>

          <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clear Local Storage</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to clear all data? This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowClearDialog(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                >
                  Clear
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      </div>
    </div>
  );
}
