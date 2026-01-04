"use client";

import * as React from "react";
import { CalendarCog, CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function ChangeDate({
    id,
    defaultDate,
    className,
    onDateChange,
    portalless,
    disabled = false,
}: {
    id?: string;
    defaultDate?: Date;
    className?: string;
    onDateChange?: (date: Date | undefined) => void;
    portalless?: boolean;
    disabled?: boolean;
}) {
    const [date, setDate] = React.useState<Date | undefined>(defaultDate);

    React.useEffect(() => {
        setDate(defaultDate);
    }, [defaultDate]);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    id={id}
                    className={cn("p-1 cursor-pointer", className)}
                    disabled={disabled}
                >
                    {date ? date.toISOString().split("T")[0] : "Select date"}
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
