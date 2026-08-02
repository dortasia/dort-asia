"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";
import { Icon } from '@iconify/react';
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export interface DropdownOption {
  value: string;
  label: string;
}

interface FormDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  icon?: string;
  disabled?: boolean;
}

export default function FormDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  icon,
  disabled = false,
}: FormDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 8}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 99999,
      });
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
      // Listen to scroll events on any scrollable parent
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
        // Also check if the click was inside the portal dropdown
        const dropdownEl = document.getElementById(`dropdown-${value}`);
        if (dropdownEl && dropdownEl.contains(event.target as Node)) return;
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, value]);

  const selectedOption = options.find((o) => o.value === value);

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
        <span className={cn("truncate", !selectedOption && "text-[#8B8B8B]")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icon 
          icon="hugeicons:arrow-down-01" 
          className={cn(
            "w-4 h-4 text-[#8B8B8B] transition-transform duration-200 pointer-events-none",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id={`dropdown-${value}`}
              style={dropdownStyle}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: [0, 0.4, 0, 1] }}
              className="bg-white border border-[#ECECEC] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1.5 overflow-y-auto max-h-[240px]"
            >
            {options.length > 0 ? (
              options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl type-small transition-all duration-150 cursor-pointer",
                      isSelected
                        ? "bg-[#F4F4F5] text-[#161616] font-medium"
                        : "text-[#616161] hover:bg-[#F4F4F5] hover:text-[#161616]"
                    )}
                  >
                    <span className="truncate pr-2">{option.label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#161616] flex-shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-center type-small text-[#8B8B8B]">
                No options
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </div>
  );
}
