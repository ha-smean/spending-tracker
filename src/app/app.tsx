import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Transaction } from "./models";
import { categories, categorizeTransaction, isAmbiguous, loadLS, months, shouldIgnoreTransaction } from "./utils";
import { MonthlyCategoryPie } from "./monthly-spending-pie";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { AlertCircle, FilePlus, FilePlusCorner, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ThemeSelector from "@/components/theme-selector";
import { CategoryBudgetDashboard } from "./category-budgets";
import { TransactionsTable } from "./transactions-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CRUDCategoryBudget } from "./crud-category-budget";

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadLS("transactions", []));
  const [reviewQueue, setReviewQueue] = useState<Transaction[]>(() => loadLS("reviewQueue", []));
  const [reviewing, setReviewing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(() => loadLS("categoryBudgets", {}));
  const [editingBudget, setEditingBudget] = useState(false);

  const [showOnboardingDialog, setShowOnboardingDialog] = useState(() => {
    const income = loadLS("income", null);
    return income === null && Object.keys(categoryBudgets).length === 0;
  });

  const current = reviewQueue[0];

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
  useEffect(() => {
    localStorage.setItem("categoryBudgets", JSON.stringify(categoryBudgets));
  }, [categoryBudgets]);

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
          if (isNaN(rawAmount)) {
            throw new Error(`Invalid amount for transaction: ${row["Description"]} amount: ${row["Amount"]}`);
          }
          // currently ignoring transfers to and from accounts and wages
          if (shouldIgnoreTransaction(row["Description"], row["Detailed Category"])) {
            return;
          }

          // construct description for better categorization
          const description = `${row["Description"] || ""} ${row["Detailed Category"] || ""} ${
            row["Primary Category"] || ""
          }`.trim();

          const isExpense = rawAmount < 0;
          // get custom category based on constructed description
          const customCategory = categorizeTransaction(description);

          const tx: Transaction = {
            id: crypto.randomUUID(),
            date: row["Authorized Date"],
            description: row["Description"],
            amount: Math.abs(rawAmount),
            type: isExpense ? "expense" : "income",
            // use custom category if available, otherwise fallback to detailed category from CSV
            category: customCategory !== "Uncategorized" ? customCategory : row["Detailed Category"],
          };

          const needsManualReview = isExpense && isAmbiguous(description) && customCategory === "Uncategorized";
          (needsManualReview ? needsReview : clean).push(tx);
        });

        setTransactions((prev) => [...prev, ...clean, ...needsReview]);
        setReviewQueue((prev) => [...prev, ...needsReview]);
        if (needsReview.length > 0) setReviewing(true);
      },
    });
  }

  // review logic
  function resolve(tx: Transaction, category: string) {
    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? { ...t, category } : t)));
    setReviewQueue((prev) => prev.filter((t) => t.id !== tx.id));
  }

  return (
    <div className="grid grid-cols-1 gap-3 p-6  mx-auto ">
      <div className="flex justify-between text-2xl font-bold">
        <div className="pl-4">Spending Tracker</div>
        <div className="flex">
          <Button variant="ghost" size="default" onClick={() => document.getElementById("csv-upload")?.click()}>
            <FilePlusCorner size={40} />
          </Button>
          <Input
            id="csv-upload"
            className="hidden"
            type="file"
            onChange={(e) => e.target.files && handleCSV(e.target.files[0])}
          />
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setShowOnboardingDialog(true);
              setEditingBudget(true);
            }}
          >
            <Settings />
          </Button>
          <ThemeSelector />{" "}
        </div>
      </div>

      <CRUDCategoryBudget
        showOnboardingDialog={showOnboardingDialog}
        setShowOnboardingDialog={setShowOnboardingDialog}
        categoryBudgets={categoryBudgets}
        setCategoryBudgets={setCategoryBudgets}
        categories={categories}
        isEditingBudget={editingBudget}
      />

      {reviewing && current && (
        <Dialog open={reviewing} onOpenChange={setReviewing}>
          <DialogContent className="w-full max-w-lg">
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

      {/* Pie Chart with shadcn Card */}
      <Card className="flex flex-col bg-transparent border-none">
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
        <CardHeader className="pb-0 flex justify-end">
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

        <CardFooter className="flex-col gap-2 text-sm items-end">
          {/* <MonthlyComparison transactions={transactions} selectedMonth={selectedMonth} /> */}
        </CardFooter>
      </Card>

      <CategoryBudgetDashboard
        monthlyTransactions={monthlyTransactions}
        selectedMonth={selectedMonth}
        categoryBudgets={categoryBudgets}
      />

      {/* Transactions Table */}
      <Card className="bg-transparent border-none">
        <CardHeader>
          <CardTitle className="text-lg font-bold ">Transactions</CardTitle>
        </CardHeader>
        <CardContent className="">
          <TransactionsTable
            monthlyTransactions={monthlyTransactions}
            onTransactionUpdate={(updatedTransaction) => {
              setTransactions((prev) => prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t)));
            }}
          />{" "}
        </CardContent>
      </Card>
      <div>
        <></>
      </div>
    </div>
  );
}
