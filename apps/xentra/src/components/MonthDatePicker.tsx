"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface MonthDatePickerProps {
  selectedDate: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

export default function MonthDatePicker({ selectedDate, onChange }: MonthDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Use today's date to determine the "current month" boundaries
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Parse the selected date
  const [selYear, selMonth, selDay] = selectedDate.split("-").map(Number);
  const selectedObj = new Date(selYear, selMonth - 1, selDay);

  // Format displayed text, e.g. "Thursday 23 July"
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(selectedObj);

  // Calendar logic
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    const tzOffset = newDate.getTimezoneOffset() * 60000;
    const localISOTime = new Date(newDate.getTime() - tzOffset).toISOString().split('T')[0];
    onChange(localISOTime);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-5 py-2.5 bg-white border border-[#E5E7EB] rounded-full text-[14px] font-normal text-[#4B5563] hover:bg-gray-50 transition-colors"
      >
        <CalendarIcon className="h-[18px] w-[18px] text-gray-500" strokeWidth={1.8} />
        <span>{formattedDate}</span>
        <ChevronDown className="h-[18px] w-[18px] text-gray-500 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-white dark:bg-[#1C1C1E] rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 dark:border-white/10 z-50 w-[280px]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[14px] font-bold text-gray-900 dark:text-white">
              {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(firstDayOfMonth)}
            </span>
            <div className="flex items-center gap-1">
              <button disabled className="p-1 text-gray-300 dark:text-gray-600 rounded-lg">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button disabled className="p-1 text-gray-300 dark:text-gray-600 rounded-lg">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="text-center text-[12px] font-medium text-gray-400">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = selYear === currentYear && selMonth - 1 === currentMonth && selDay === day;
              const isToday = today.getDate() === day;

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`
                    h-8 w-8 rounded-full flex items-center justify-center text-[13px] font-medium transition-colors
                    ${isSelected 
                      ? "bg-[var(--user-accent)] text-white" 
                      : isToday 
                        ? "bg-gray-100 dark:bg-[#2C2C2E] text-[var(--user-accent)]" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2C2C2E]"
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
