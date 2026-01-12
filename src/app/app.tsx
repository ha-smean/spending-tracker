import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Transaction } from "./models";
import { categories, categorizeTransaction, isAmbiguous, loadLS, months, shouldIgnoreTransaction } from "./utils";
import { MonthlyCategoryPie } from "./monthly-spending-pie";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { FilePlusCorner, MousePointerClick, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ThemeSelector from "@/components/theme-selector";
import { CategoryBudgetDashboard } from "./category-budgets";
import { TransactionsTable } from "./transactions-table";
import { Input } from "@/components/ui/input";
import { CRUDCategoryBudget } from "./crud-category-budget";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadLS("transactions", []));
  const [reviewQueue, setReviewQueue] = useState<Transaction[]>(() => loadLS("reviewQueue", []));
  const [reviewing, setReviewing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
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
    const isExportedFile = file.name.startsWith("exported");
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const clean: Transaction[] = [];
          const needsReview: Transaction[] = [];

          results.data.forEach((row: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
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

            // determines the category to use based on the file type and custom category assignment
            const category = isExportedFile
              ? row["Detailed Category"]
              : customCategory !== "Uncategorized"
              ? customCategory
              : row["Detailed Category"] || customCategory;

            const tx: Transaction = {
              id: crypto.randomUUID(),
              date: row["Authorized Date"],
              description: row["Description"],
              amount: Math.abs(rawAmount),
              type: isExpense ? "expense" : "income",
              // use custom category if available, otherwise fallback to detailed category from CSV
              category: category,
            };

            const needsManualReview =
              isExpense && isAmbiguous(description) && customCategory === "Uncategorized" && !isExportedFile;
            (needsManualReview ? needsReview : clean).push(tx);
          });

          setTransactions((prev) => [...prev, ...clean, ...needsReview]);
          setReviewQueue((prev) => [...prev, ...needsReview]);
          if (needsReview.length > 0) setReviewing(true);

          toast.success(
            isExportedFile
              ? `Successfully imported transactions from previously exported file`
              : `Successfully imported transactions from sofi`
          );
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to parse CSV");
        }
      },
    });
  }

  // review logic
  function resolve(tx: Transaction, category: string) {
    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? { ...t, category } : t)));
    setReviewQueue((prev) => prev.filter((t) => t.id !== tx.id));
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="max-w-7xl mx-auto px-30 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 pt-2">
              {/* <img
                src={logoDarkmode}
                alt="Expense Tracker Logo"
                width={250}
                height={250}
                className="hidden dark:block"
              />
              <img
                src={logoLightmode}
                alt="Expense Tracker Logo"
                width={250}
                height={250}
                className="block dark:hidden"
              /> */}
            </div>
            <div className="flex items-center text-muted-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => document.getElementById("csv-upload")?.click()}>
                    <FilePlusCorner className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Upload CSV</TooltipContent>
              </Tooltip>
              <Input
                id="csv-upload"
                className="hidden"
                type="file"
                onChange={(e) => e.target.files && handleCSV(e.target.files[0])}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowOnboardingDialog(true);
                      setEditingBudget(true);
                    }}
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
              <ThemeSelector />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 place-items-center">
        {/* <SaveTransactions></SaveTransactions> */}
        {/* Review Alert */}
        {reviewQueue.length > 0 && monthlyTransactions.length > 0 && (
          <div className="">
            <Button size={"sm"} className=" bg-yellow-500 hover:bg-yellow-500/90 " onClick={() => setReviewing(true)}>
              <MousePointerClick className="h-5 w-5" />
              {reviewQueue.length} transactions need review
            </Button>
          </div>
        )}

        {/* Onboarding */}
        <CRUDCategoryBudget
          showOnboardingDialog={showOnboardingDialog}
          setShowOnboardingDialog={setShowOnboardingDialog}
          categoryBudgets={categoryBudgets}
          setCategoryBudgets={setCategoryBudgets}
          categories={categories}
          isEditingBudget={editingBudget}
        />

        {/* Review Dialog */}
        {reviewing && current && (
          <Dialog open={reviewing} onOpenChange={setReviewing}>
            <DialogContent className="w-full max-w-lg">
              <DialogHeader>
                <DialogTitle>Review Transaction</DialogTitle>
              </DialogHeader>
              <div className="text-sm space-y-4">
                <div className="space-y-2 bg-muted p-4 rounded-lg">
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

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 gap-6 mb-8 w-3/4">
          {/* Pie Chart */}
          <Card className="col-span-1 bg-transparent border-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-end space-y-0 pb-4">
              {/* <h2 className="text-lg font-semibold">Monthly Breakdown</h2> */}
              <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
                <SelectTrigger className="w-40">
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
            <CardContent className="flex items-center justify-center py-8 ">
              <MonthlyCategoryPie monthlyTransactions={monthlyTransactions} categories={categories} />
            </CardContent>
          </Card>

          {/* Budget Dashboard */}
          <div className="col-span-1">
            <CategoryBudgetDashboard
              monthlyTransactions={monthlyTransactions}
              selectedMonth={selectedMonth}
              categoryBudgets={categoryBudgets}
            />
          </div>
        </div>

        {/* Transactions Table */}
        <TransactionsTable
          monthlyTransactions={monthlyTransactions}
          onTransactionUpdate={(updatedTransaction) => {
            setTransactions((prev) => prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t)));
          }}
        />
      </div>
    </div>
  );
}
