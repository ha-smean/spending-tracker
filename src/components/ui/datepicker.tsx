"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
export function DatePicker({
  id,
  defaultDate,
  className,
  onDateChange,
  portalless,
  placeholder = "Pick a date",
  disabled = false,
}: {
  id?: string;
  defaultDate?: Date;
  className?: string;
  onDateChange?: (date: Date | undefined) => void;
  portalless?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [date, setDate] = React.useState<Date | undefined>(defaultDate);

  React.useEffect(() => {
    setDate(defaultDate);
  }, [defaultDate]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant={"outline"}
          className={cn(
            "flex w-full justify-start text-left font-normal disabled:opacity-100 disabled:text-muted-foreground disabled:[&_svg]:text-muted-foreground bg-transparent dark:bg-input/50",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon />
          {<span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      {portalless ? (
        <PopoverContent className="w-auto p-0 z-50" align="center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(e) => {
              if (!disabled) {
                setDate(e);
                if (onDateChange) {
                  onDateChange(e);
                }
              }
            }}
            autoFocus
            disabled={disabled}
          />
        </PopoverContent>
      ) : (
        <PopoverContent className="w-auto p-0 z-50" align="center">
          <Calendar
            mode="single"
            selected={date}
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
      )}
    </Popover>
  );
}
