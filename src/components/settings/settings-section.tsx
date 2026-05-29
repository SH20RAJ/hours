import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** A titled settings group rendered as a card with a header and body. */
export function SettingsSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="border-b border-border p-5">
        <h2 className="font-semibold">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

/** A single labeled row inside a section, with the control on the right. */
export function SettingRow({
  label,
  description,
  children,
  htmlFor,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2.5">
      <label htmlFor={htmlFor} className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {description && (
          <span className="block text-sm text-muted-foreground">{description}</span>
        )}
      </label>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
