"use client";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import SaveTransactions from "./save-transactions";
import { Eraser } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface Category {
  name: string;
}

interface CrudCategoryBudgetProps {
  showOnboardingDialog: boolean;
  setShowOnboardingDialog: (show: boolean) => void;
  categories: Category[];
  isEditingBudget?: boolean;
  setCategoryBudgets: (
    budgets: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)
  ) => void;
  categoryBudgets: Record<string, number>;
}

export function CRUDCategoryBudget({
  showOnboardingDialog,
  setShowOnboardingDialog,
  categories,
  isEditingBudget,
  categoryBudgets,
  setCategoryBudgets,
}: CrudCategoryBudgetProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState(localStorage.getItem("MonthlyIncome") || "");

  const previousBudgets = useMemo(() => {
    const stored = localStorage.getItem("categoryBudgets");
    return stored ? JSON.parse(stored) : {};
  }, [showOnboardingDialog]);

  const previousIncome = useMemo(() => {
    return localStorage.getItem("MonthlyIncome") || "";
  }, [showOnboardingDialog]);

  const income = parseFloat(monthlyIncome) || 0;
  const totalBudgeted = Object.values(categoryBudgets).reduce((sum, val) => sum + val, 0);
  const remainingIncome = income - totalBudgeted;

  const handleOpenChange = (open: boolean) => {
    if (
      !open &&
      (JSON.stringify(categoryBudgets) !== JSON.stringify(previousBudgets) || monthlyIncome !== previousIncome)
    ) {
      setShowConfirmDialog(true);
    } else {
      setShowOnboardingDialog(open);
    }
  };

  const handleDiscard = () => {
    setCategoryBudgets(previousBudgets);
    setMonthlyIncome(previousIncome);
    setShowConfirmDialog(false);
    setShowOnboardingDialog(false);
  };

  const handleSave = () => {
    localStorage.setItem("categoryBudgets", JSON.stringify(categoryBudgets));
    localStorage.setItem("MonthlyIncome", monthlyIncome);
    setShowConfirmDialog(false);
    setShowOnboardingDialog(false);
  };

  return (
    <>
      <Dialog open={showOnboardingDialog} onOpenChange={handleOpenChange}>
        <DialogContent className=" " onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex flex-row items-center text-3xl font-bold ">
              {isEditingBudget ? "Adjust your budget settings" : "Set up your spending plan"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isEditingBudget
                ? "Modify your income and category limits to better suit your needs ⋆˙⟡˚✧"
                : "Define your monthly income and spending limits by category to get started ⋆˙⟡˚✧"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 ">
            <div className="">
              <Label htmlFor="income" className="text-sm font-semibold">
                Monthly Income
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="income"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="pl-7 text-lg w-full"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Category Budgets</Label>
                {monthlyIncome !== "" && (
                  <div className="px-3 py-2 bg-muted rounded-lg">
                    <p className="text-sm">
                      Remaining:{" "}
                      <span
                        className={
                          remainingIncome < 0 ? "text-destructive font-semibold" : "text-green-600 font-semibold"
                        }
                      >
                        ${remainingIncome.toFixed(2)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {categories
                  .filter((cat) => cat.name !== "Jazmin Purchases")
                  .map((cat) => (
                    <div key={cat.name} className="">
                      <Label htmlFor={cat.name} className="text-xs text-muted-foreground tracking-wide">
                        {cat.name}
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          // disabled={monthlyIncome === ""}
                          id={cat.name}
                          value={categoryBudgets[cat.name] || ""}
                          onChange={(e) => {
                            setCategoryBudgets((prev: Record<string, number>) => ({
                              ...prev,
                              [cat.name]: parseFloat(e.target.value) || 0,
                            }));
                          }}
                          className="pl-7"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-4 border-t">
            <div className="flex justify-between">
              {isEditingBudget && <SaveTransactions />}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowClearDialog(true)}
                    className="text-muted-foreground hover:text-destructive flex items-center gap-2"
                  >
                    <Eraser className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear all data</TooltipContent>
              </Tooltip>
            </div>
            <div>
              <Button onClick={handleSave} size="sm">
                {isEditingBudget ? "Save Changes" : "Get Started"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="w-full max-w-lg">
          <DialogHeader>
            <DialogTitle>Clear Local Storage</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all data? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 pt-4 ">
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
                toast.success("All data cleared");
              }}
            >
              Clear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="w-full max-w-lg">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>You have unsaved changes. Do you want to save them?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3">
            <Button variant="destructive" onClick={handleDiscard}>
              Discard
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
