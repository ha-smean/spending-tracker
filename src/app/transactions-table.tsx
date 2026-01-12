import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  getFilteredRowModel,
} from "@tanstack/react-table";
import type { Transaction } from "./models";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo } from "react";
import {
  CalendarFold,
  ChevronsUpDown,
  CircleDollarSign,
  PiggyBank,
  ReceiptText,
  Search,
} from "lucide-react";
import { useState } from "react";
import { categories } from "./utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChangeDate } from "@/components/ui/change-date";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";

interface TransactionsTableProps {
  monthlyTransactions: Transaction[];
  onTransactionUpdate?: (transaction: Transaction) => void;
}

export function TransactionsTable({ monthlyTransactions, onTransactionUpdate }: TransactionsTableProps) {
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([{ id: "date", desc: false }]);
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const tableData = useMemo(() => {
    console.log("monthly transactions changes", monthlyTransactions);
    return monthlyTransactions.map((transaction) => ({
      ...transaction,
    }));
  }, [monthlyTransactions]);

  const columns: ColumnDef<Transaction>[] = [
    { accessorKey: "date", header: "Date" },
    { accessorKey: "description", header: "Description" },
    { accessorKey: "amount", header: "Amount" },
    { accessorKey: "category", header: "Category" },
  ];

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
  });

  const groupedByDate = table.getRowModel().rows.reduce((acc, row) => {
    const date = row.original.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(row.original);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) =>
    sorting[0]?.desc ? b.localeCompare(a) : a.localeCompare(b)
  );

  // Force table to re-compute when monthlyTransactions changes
  useEffect(() => {
    console.log("Resetting table due to monthlyTransactions change");
    table.reset();
  }, [monthlyTransactions, table]);

  return (
    <div className="flex-1 w-3/4 ">
      <div className="mb-4 flex items-center gap-2 m-2 ">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search transactions..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSorting([{ id: "date", desc: sorting[0]?.desc ? false : true }])}
          className="flex gap-2"
        >
          Sort
          <ChevronsUpDown className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-6 p-4">
        {sortedDates.map((date) => (
          <div key={date}>
            <h3 className="text-sm font-outfit font-medium mb-3 text-muted-foreground pl-1">
              {new Date(date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
                timeZone: "UTC",
              })}
            </h3>
            {groupedByDate[date].map((transaction) => (
              <Dialog key={`${transaction.id}`}>
                <DialogTrigger
                  asChild
                  className="bg-card font-outfit rounded-2xl shadow-sm hover:bg-accent/50 focus:outline-none focus:ring-12 focus:ring-accent/50 "
                >
                  <div className=" p-4 cursor-pointer justify-between flex items-center  h-17">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate w-30" title={transaction.description}>
                        {transaction.description}
                      </span>
                    </div>
                    <Select
                      value={transaction.category}
                      onValueChange={(value) => onTransactionUpdate?.({ ...transaction, category: value })}
                    >
                      <SelectTrigger className="text-sm text-muted-foreground border-none shadow-none hover:bg-accent/20 cursor-pointer [&_svg]:hidden hover:[&_svg]:block">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.name} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className={transaction.type === "expense" ? " font-semibold" : "text-positive font-semibold"}>
                      {transaction.type === "expense" ? "-" : ""}${transaction.amount.toFixed(2)}
                    </span>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
                  <DialogTitle></DialogTitle>
                  <DialogDescription></DialogDescription>
                  <DialogHeader className="text-center"></DialogHeader>
                  <div className="flex flex-col items-center space-y-6 py-4">
                    <div className="flex flex-col items-center space-y-2">
                      <div>
                        {transaction.type === "expense" ? <CircleDollarSign size={40} /> : <PiggyBank size={50} />}
                      </div>
                      <div className="text-4xl font-semibold font-outfit">
                        {transaction.type === "expense" ? "-" : ""}${transaction.amount.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">{transaction.description}</div>
                    </div>

                    <div className="w-full space-y-3 pt-6">
                      <div className="grid grid-cols-2 bg-card p-4 rounded-lg shadow-sm items-center">
                        <div className="flex text-sm font-outfit font-medium gap-2 ">
                          <CalendarFold size={18} />
                          Authorized Date
                        </div>
                        <ChangeDate
                          defaultDate={new Date(transaction.date)}
                          onDateChange={(date) => {
                            if (date) {
                              const newDate = date.toISOString().split("T")[0];
                              onTransactionUpdate?.({ ...transaction, date: newDate });
                            }
                          }}
                          className="w-full"
                        />
                      </div>
                      <div className="grid grid-cols-2 bg-card p-4 rounded-lg shadow-sm items-center">
                        <div className="flex text-sm font-outfit font-medium jusitify-between ">
                          <ReceiptText size={18} className="inline-block mr-2" />
                          Category
                        </div>
                        <Select
                          defaultValue={transaction.category}
                          onValueChange={(value) => onTransactionUpdate?.({ ...transaction, category: value })}
                        >
                          <SelectTrigger className="justify-self-end font-outfit text-sm  border-none shadow-none hover:bg-accent/50 cursor-pointer ">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.name} value={cat.name}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
