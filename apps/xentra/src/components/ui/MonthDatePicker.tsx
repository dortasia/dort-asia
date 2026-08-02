"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const [selYear, selMonth, selDay] = selectedDate ? selectedDate.split("-").map(Number) : [currentYear, currentMonth + 1, today.getDate()];
  const selectedObj = new Date(selYear, selMonth - 1, selDay);

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(selectedObj);

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

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
        className="flex items-center gap-3 px-4 py-2 bg-[#F4F4F5] hover:bg-[#E4E4E7] rounded-full transition-colors type-small text-[#161616] h-[42px]"
      >
        <CalendarIcon className="h-4 w-4 text-[#616161]" />
        <span>{formattedDate}</span>
        <ChevronDown className="h-4 w-4 text-[#616161] ml-1" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0, 0.4, 0, 1] }}
            className="absolute top-full left-0 mt-2 p-4 bg-white rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 z-50 w-[280px]"
          >
            <div className="flex items-center justify-between mb-4">
            <span className="type-body-medium text-[#161616]">
              {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(firstDayOfMonth)}
            </span>
            <div className="flex items-center gap-1">
              <button disabled className="p-1 text-gray-300 rounded-lg">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button disabled className="p-1 text-gray-300 rounded-lg">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="text-center type-caption text-[#8B8B8B]">
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
                    h-8 w-8 rounded-full flex items-center justify-center type-small transition-colors
                    ${isSelected 
                      ? "bg-[#007AFF] text-white shadow-sm" 
                      : isToday 
                        ? "bg-gray-100 text-[#007AFF]" 
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
