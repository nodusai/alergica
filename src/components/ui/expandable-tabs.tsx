import React, { useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnClickOutside } from "usehooks-ts";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Tab {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
}

interface ExpandableTabsProps {
  tabs: Tab[];
  className?: string;
  activeColor?: string;
}

const buttonVariants = {
  initial: { gap: 0, paddingLeft: "0.625rem", paddingRight: "0.625rem" },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? "0.5rem" : 0,
    paddingLeft: isSelected ? "1rem" : "0.625rem",
    paddingRight: isSelected ? "1rem" : "0.625rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.05, type: "spring" as const, bounce: 0, duration: 0.35 };

export function ExpandableTabs({ tabs, className, activeColor = "hsl(var(--primary))" }: ExpandableTabsProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const outsideRef = useRef<HTMLDivElement>(null!);

  useOnClickOutside(outsideRef, () => setSelected(null));

  const handleSelect = useCallback(
    (index: number) => {
      setSelected(index);
      tabs[index].onClick?.();
    },
    [tabs]
  );

  return (
    <div
      ref={outsideRef}
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-1 shadow-lg",
        className
      )}
    >
      {tabs.map((tab, index) => {
        const Icon = tab.icon;
        const isSelected = selected === index;

        return (
          <motion.button
            key={tab.label}
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={isSelected}
            onClick={() => handleSelect(index)}
            transition={transition}
            className={cn(
              "relative flex items-center rounded-xl px-2.5 py-2 text-sm font-medium transition-colors duration-300",
              isSelected
                ? "bg-primary/10"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon
              size={20}
              style={{ color: isSelected ? activeColor : undefined }}
            />
            <AnimatePresence initial={false}>
              {isSelected && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="overflow-hidden whitespace-nowrap"
                  style={{ color: activeColor }}
                >
                  {tab.label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
