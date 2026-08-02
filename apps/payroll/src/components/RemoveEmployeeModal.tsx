import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface RemoveEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  employeeName: string;
  isRemoving?: boolean;
}

export default function RemoveEmployeeModal({
  isOpen,
  onClose,
  onConfirm,
  employeeName,
  isRemoving = false
}: RemoveEmployeeModalProps) {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (inputValue === employeeName) {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1C1C22] border border-[#E5E5EA] dark:border-[#2C2C35] rounded-3xl max-w-md w-full p-6 text-center animate-in zoom-in-95 duration-200 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-[#2C2C35]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto h-14 w-14 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center text-red-600 dark:text-red-500 mb-4">
          <AlertTriangle className="h-7 w-7" strokeWidth={2.5} />
        </div>
        
        <h3 className="text-[20px] font-bold text-gray-900 dark:text-white leading-tight mb-2">
          Remove Employee
        </h3>
        
        <p className="text-[14px] text-gray-600 dark:text-gray-400 mt-2 mb-6 leading-relaxed px-2 text-left">
          You are about to remove <strong>{employeeName}</strong> from this department.
        </p>
        <ul className="list-disc list-inside mt-2 text-[13px] text-gray-600 dark:text-gray-400 space-y-1 mb-6 text-left px-2">
          <li>This employee will no longer be part of this department.</li>
          <li>They will remain in the company's main employee list.</li>
        </ul>

        <div className="mb-6 text-left">
          <label className="block text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-2">
            Please type <strong>{employeeName}</strong> to confirm.
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full bg-[#F4F5F7] dark:bg-[#121217] border border-[#E5E7EB] dark:border-[#2C2C35] rounded-[14px] px-4 py-3 text-[14px] font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            placeholder={employeeName}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 bg-[#F2F2F7] dark:bg-[#2C2C35]/50 hover:bg-[#E5E5EA] dark:hover:bg-[#2C2C35] text-gray-700 dark:text-gray-300 rounded-xl text-[14px] font-bold transition-all"
            disabled={isRemoving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={inputValue !== employeeName || isRemoving}
            className="flex-1 h-12 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-xl text-[14px] font-bold transition-all flex items-center justify-center"
          >
            {isRemoving ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Remove Employee"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
