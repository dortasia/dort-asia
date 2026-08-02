"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface FormDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  icon?: string;
  disabled?: boolean;
}

export default function FormDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  icon = "hugeicons:calendar-03",
  disabled = false,
}: FormDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [openSelector, setOpenSelector] = useState<'month' | 'year' | null>(null);

  useEffect(() => {
    if (openSelector === 'month') {
      setTimeout(() => {
        document.getElementById('month-selector-active')?.scrollIntoView({ block: 'center' });
      }, 0);
    } else if (openSelector === 'year') {
      setTimeout(() => {
        document.getElementById('year-selector-active')?.scrollIntoView({ block: 'center' });
      }, 0);
    }
  }, [openSelector]);

  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const pickerHeight = 340;
      const spaceBelow = window.innerHeight - rect.bottom;
      
      // If there is enough space below OR not enough space above, position below
      if (spaceBelow >= pickerHeight || rect.top < pickerHeight) {
        setDropdownStyle({
          position: 'fixed',
          top: `${rect.bottom + 8}px`,
          left: `${Math.min(rect.left, window.innerWidth - 300)}px`,
          zIndex: 99999,
          pointerEvents: 'auto',
        });
      } else {
        setDropdownStyle({
          position: 'fixed',
          bottom: `${window.innerHeight - rect.top + 8}px`,
          left: `${Math.min(rect.left, window.innerWidth - 300)}px`,
          zIndex: 99999,
          pointerEvents: 'auto',
        });
      }
    }
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isOpen && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const pickerEl = document.getElementById(`datepicker-portal`);
        if (pickerEl && pickerEl.contains(event.target as Node)) return;
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const today = new Date();
  
  // Use selected date or today
  const initialDate = value ? new Date(value) : today;
  
  const [currentViewDate, setCurrentViewDate] = useState(initialDate);

  // When opening, reset view to selected date
  useEffect(() => {
    if (isOpen) {
      setCurrentViewDate(value ? new Date(value) : new Date());
    }
  }, [isOpen, value]);

  const currentYear = currentViewDate.getFullYear();
  const currentMonth = currentViewDate.getMonth();

  let formattedDate = "";
  if (value) {
    const [y, m, d] = value.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    formattedDate = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(dateObj);
  }

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const handleDateClick = (day: number) => {
    // Construct local date avoiding timezone shift
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${currentYear}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // For checking selection
  const [selYear, selMonth, selDay] = value ? value.split("-").map(Number) : [null, null, null];

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between pr-3.5 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl type-small focus:outline-none focus:border-[#C8DF52] focus:bg-white transition-all cursor-pointer",
          icon ? "pl-10" : "pl-3.5",
          disabled && "opacity-50 cursor-not-allowed",
          isOpen && "border-[#C8DF52] bg-white"
        )}
      >
        {icon && (
          <Icon icon={icon} className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B8B8B] pointer-events-none" />
        )}
        <span className={cn("truncate", !value ? "text-[#8B8B8B]" : "!text-[#161616]")}>
          {value ? formattedDate : placeholder}
        </span>
      </button>

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id="datepicker-portal"
              style={dropdownStyle}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0, 0.4, 0, 1] }}
              className="p-4 bg-white rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 w-[280px] pointer-events-auto"
            >
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1.5">
                <div className="relative">
                  <button 
                    type="button" 
                    onClick={() => setOpenSelector(openSelector === 'month' ? null : 'month')}
                    className="flex items-center gap-1 bg-[#F4F4F5] !text-[#161616] text-sm font-medium rounded-md px-2 py-1 outline-none cursor-pointer hover:bg-[#E5E7EB] transition-colors"
                  >
                    {new Date(0, currentMonth).toLocaleString('en-US', { month: 'short' })}
                    <Icon icon="hugeicons:arrow-down-01" className="w-3 h-3 text-[#616161]" />
                  </button>
                  {openSelector === 'month' && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-[#ECECEC] shadow-lg rounded-xl max-h-48 overflow-y-auto z-[999999] py-1 w-24">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <button
                          key={i}
                          id={i === currentMonth ? 'month-selector-active' : undefined}
                          type="button"
                          onClick={() => {
                            setCurrentViewDate(new Date(currentYear, i, 1));
                            setOpenSelector(null);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-1.5 text-sm transition-colors cursor-pointer !text-[#161616]",
                            i === currentMonth ? "bg-[#F4F4F5] font-medium" : "hover:bg-[#F4F4F5]"
                          )}
                        >
                          {new Date(0, i).toLocaleString('en-US', { month: 'short' })}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button 
                    type="button" 
                    onClick={() => setOpenSelector(openSelector === 'year' ? null : 'year')}
                    className="flex items-center gap-1 bg-[#F4F4F5] !text-[#161616] text-sm font-medium rounded-md px-2 py-1 outline-none cursor-pointer hover:bg-[#E5E7EB] transition-colors"
                  >
                    {currentYear}
                    <Icon icon="hugeicons:arrow-down-01" className="w-3 h-3 text-[#616161]" />
                  </button>
                  {openSelector === 'year' && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-[#ECECEC] shadow-lg rounded-xl max-h-48 overflow-y-auto z-[999999] py-1 w-24">
                      {Array.from({ length: 100 }).map((_, i) => {
                        const year = new Date().getFullYear() - 80 + i;
                        return (
                          <button
                            key={year}
                            id={year === currentYear ? 'year-selector-active' : undefined}
                            type="button"
                            onClick={() => {
                              setCurrentViewDate(new Date(year, currentMonth, 1));
                              setOpenSelector(null);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-1.5 text-sm transition-colors cursor-pointer !text-[#161616]",
                              year === currentYear ? "bg-[#F4F4F5] font-medium" : "hover:bg-[#F4F4F5]"
                            )}
                          >
                            {year}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 text-[#616161] hover:bg-[#F4F4F5] rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button 
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 text-[#616161] hover:bg-[#F4F4F5] rounded-lg transition-colors cursor-pointer"
                >
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
                const isSelected = selYear === currentYear && (selMonth! - 1) === currentMonth && selDay === day;
                const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center type-small transition-colors cursor-pointer",
                      isSelected 
                        ? "bg-[#C8DF52] !text-[#161616] font-medium shadow-sm" 
                        : isToday 
                          ? "bg-gray-100 text-[#C8DF52] font-medium" 
                          : "!text-[#161616] hover:bg-[#F4F4F5]"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
