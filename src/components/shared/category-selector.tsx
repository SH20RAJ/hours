"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryDot } from "@/components/shared/category-dot";
import type { Category } from "@/lib/types";

interface CategorySelectorProps {
  categories: Category[];
  value?: string;
  onChange: (categoryId: string) => void;
  placeholder?: string;
  id?: string;
  "aria-label"?: string;
}

/** Category dropdown with color dots. Shared by timer, manual entry, and goals. */
export function CategorySelector({
  categories,
  value,
  onChange,
  placeholder = "Choose a category",
  id,
  ...aria
}: CategorySelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} aria-label={aria["aria-label"] ?? "Category"}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {categories.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            <span className="flex items-center gap-2">
              <CategoryDot color={c.color} />
              {c.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
