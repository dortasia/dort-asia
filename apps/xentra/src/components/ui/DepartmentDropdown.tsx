"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Department {
  id: string;
  department_name: string;
}

interface DepartmentDropdownProps {
  departments: Department[];
  selectedId: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

export default function DepartmentDropdown({
  departments,
  selectedId,
  onSelect,
  isLoading = false,
}: DepartmentDropdownProps) {
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

  const selectedDepartment = departments.find((d) => d.id === selectedId);
  const displayLabel = isLoading
    ? "Loading..."
    : selectedDepartment?.department_name || "Admin Department";

  return (
    <div className="relative inline-block text-right" ref={containerRef}>
      <button
        type="button"
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        disabled={isLoading}
        className="group flex items-center gap-2 type-h2 text-[#161616] hover:text-[#000000] focus:outline-none transition-colors cursor-pointer py-1"
      >
        <span>{displayLabel}</span>
        <ChevronDown
          className={`w-5 h-5 text-[#616161] group-hover:text-[#161616] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0, 0.4, 0, 1] }}
            className="absolute right-0 top-full mt-2 w-[240px] bg-white border border-[#ECECEC] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1.5 z-50 max-h-[300px] overflow-y-auto overflow-x-hidden"
          >
            {departments.length > 0 ? (
              departments.map((dept) => {
                const isSelected = dept.id === selectedId;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      onSelect(dept.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl type-body transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-[#F4F4F5] text-[#161616] font-medium"
                        : "text-[#616161] hover:bg-[#F4F4F5] hover:text-[#161616]"
                    }`}
                  >
                    <span className="truncate pr-2">{dept.department_name}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#161616] flex-shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-center type-small text-[#8B8B8B]">
                No departments available
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
