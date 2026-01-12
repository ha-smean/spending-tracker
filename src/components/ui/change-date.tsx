"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function ChangeDate({
  id,
  defaultDate,
  className,
  onDateChange,
  disabled = false,
}: {
  id?: string;
  defaultDate?: Date;
  className?: string;
  onDateChange?: (date: Date | undefined) => void;
  disabled?: boolean;
}) {
  const [date, setDate] = React.useState<Date | undefined>(defaultDate);

  React.useEffect(() => {
    setDate(defaultDate);
  }, [defaultDate]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button id={id} className={cn("p-1 cursor-pointer font-outfit font-medium text-sm text-right", className)} disabled={disabled}>
          {date
            ? date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })
            : "Select date"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50" align="center">
        <Calendar
          mode="single"
          selected={date ? new Date(date.getTime() + 86400000) : undefined}
          onSelect={(e) => {
            if (!disabled) {
              setDate(e);
              if (onDateChange && e) {
                onDateChange(e);
              }
            }
          }}
          autoFocus
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
}
