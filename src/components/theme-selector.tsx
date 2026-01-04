"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ThemeSelector = () => {
  const { resolvedTheme, setTheme } = useTheme();

  // update html class for theme
  React.useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.className = resolvedTheme || "";
  }, [resolvedTheme]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="flex items-center gap-2 cursor-pointer"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle mode</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ThemeSelector;
