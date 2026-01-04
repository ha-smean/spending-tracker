import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  getFilteredRowModel,
} from "@tanstack/react-table";
import type { Transaction } from "./models";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Search } from "lucide-react";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { categories, loadLS } from "./utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/datepicker";
import { ChangeDate } from "@/components/ui/change-date";
import { Input } from "@/components/ui/input";

interface TransactionsTableProps {
  monthlyTransactions: Transaction[];
  onTransactionUpdate?: (transaction: Transaction) => void;
}

export function TransactionsTable({ monthlyTransactions, onTransactionUpdate }: TransactionsTableProps) {
  const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button
          className="flex w-full justify-start gap-2"
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      ),
      cell: ({ row }) => {
        const [value, setValue] = useState(row.original.date.toString());

        return (
          <ChangeDate
            defaultDate={new Date(value)}
            onDateChange={(date: Date | undefined) => {
              if (date) {
                const newValue = date.toISOString().split("T")[0];
                setValue(newValue);
                const updated = { ...row.original, date: newValue };
                onTransactionUpdate?.(updated);
              }
            }}
            className="w-full text-left"
          />
        );
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <Button
          className="flex w-full justify-start gap-2"
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Description
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      ),
      cell: ({ row }) =>
        row.original.description.length > 35 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="truncate max-w-95">{row.original.description}</div>
            </TooltipTrigger>
            <TooltipContent>{row.original.description}</TooltipContent>
          </Tooltip>
        ) : (
          <div className="truncate max-w-95">{row.original.description}</div>
        ),
    },
    {
      accessorKey: "amount",
      header: ({ column }: any) => (
        <Button
          className="flex w-full justify-start gap-2"
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
    ),
    cell: ({ row }) => {
      const isExpense = row.original.type === "expense";
      const sign = isExpense ? "-" : "+";
      const colorClass = isExpense ? "text-negative" : "text-positive";
      return <span className={colorClass}>{sign}${row.original.amount.toFixed(2)}</span>;
    },
    },
    {
    accessorKey: "category",
    header: ({ column }) => (
        <Button
          className="flex w-full justify-start gap-2"
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Category
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      ),
      cell: ({ row }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [value, setValue] = useState(row.original.category);

        const handleSave = (newValue: string) => {
          setValue(newValue);
          setIsEditing(false);

          const updated = { ...row.original, category: newValue };
          onTransactionUpdate?.(updated);
        };

        return isEditing ? (
          <Select value={value} onValueChange={handleSave}>
            <SelectTrigger className="w-full" autoFocus>
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
        ) : (
          <div onDoubleClick={() => setIsEditing(true)} className="cursor-pointer">
            {value}
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: ({ column }: any) => (
        <Button
          className="flex w-full justify-start gap-2"
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Type
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      ),
      cell: ({ row }) => <span className="capitalize">{row.original.type}</span>,
    },
  ];

  const table = useReactTable({
    data: monthlyTransactions,
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
  return (
    <div>
    <div className="mb-4 flex items-center gap-2 m-2">
      <Search className="h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search transactions..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="w-full"
      />
    </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
