"use client";

import * as React from "react";
import { Palette } from "lucide-react";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button"; // using a simple button

const ThemeSelector = () => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  // update html class for theme
  React.useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.className = resolvedTheme || "";
  }, [resolvedTheme]);

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          {(resolvedTheme || "theme").charAt(0).toUpperCase() + (resolvedTheme || "theme").slice(1)}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>Light Theme</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Dark Theme</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("legacy")}>Legacy Theme</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>System Theme</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSelector;
