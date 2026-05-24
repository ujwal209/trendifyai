"use client";

import React from "react";
import * as Icons from "lucide-react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/products";
import { useAi } from "@/lib/ai-context";
import { cn } from "@/lib/utils";

interface CategoryBarProps {
  selectedCategory: string;
}

export default function CategoryBar({ selectedCategory }: CategoryBarProps) {
  const router = useRouter();
  const { isOpen } = useAi();

  const handleSelectCategory = (categoryId: string) => {
    if (categoryId === "all") {
      router.push("/");
    } else {
      router.push(`/category/${categoryId}`);
    }
  };

  return (
    <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 font-sans">
      <div className={cn(
        "mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-3 sm:px-6 scrollbar-none lg:px-8",
        isOpen
          ? "justify-start 2xl:justify-center"
          : "justify-start md:justify-center"
      )}>
        {CATEGORIES.map((category) => {
          // Dynamic Lucide Icon mapping
          const IconComponent = (Icons as any)[category.icon] || Icons.HelpCircle;
          const isSelected = selectedCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => handleSelectCategory(category.id)}
              className={`flex flex-col items-center gap-1.5 cursor-pointer border-b-2 px-3 py-1 transition-all duration-200 hover:-translate-y-0.5 ${
                isSelected
                  ? "border-[#2874f0] text-[#2874f0] font-bold"
                  : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full bg-zinc-50 transition-colors dark:bg-zinc-900 ${
                  isSelected ? "bg-blue-50 text-[#2874f0] dark:bg-blue-950/30" : ""
                }`}
              >
                <IconComponent className="h-5 w-5 stroke-[1.8]" />
              </div>
              <span className="text-[12px] font-medium tracking-wide whitespace-nowrap">
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
