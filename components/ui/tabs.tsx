"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = { value: string; setValue: (value: string) => void };
const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext(component: string) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error(`${component} must be used inside <Tabs>`);
  return ctx;
}

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
  const value = controlledValue ?? uncontrolled;

  function setValue(next: string) {
    onValueChange?.(next);
    if (controlledValue === undefined) setUncontrolled(next);
  }

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

// Styled like manila-folder tabs: the active tab sits flush against the
// panel below (same background, no shared border seam) while inactive tabs
// sit a couple pixels lower and behind it, like folders stacked in a drawer.
export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("relative z-0 flex flex-wrap items-end gap-1", className)}>{children}</div>;
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const { value: active, setValue } = useTabsContext("TabsTrigger");
  const isActive = active === value;

  return (
    <button
      type="button"
      onClick={() => setValue(value)}
      aria-selected={isActive}
      className={cn(
        "flex items-center gap-2 rounded-t-md border-2 border-black px-4 py-2 text-sm font-bold uppercase tracking-tight transition-all",
        isActive
          ? "relative z-10 -mb-[2px] border-b-0 bg-card pb-[10px] text-foreground"
          : "translate-y-[2px] bg-secondary text-muted-foreground hover:bg-secondary/70",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const { value: active } = useTabsContext("TabsContent");
  if (active !== value) return null;
  return <div className={className}>{children}</div>;
}
