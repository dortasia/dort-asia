import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const alerts = [
  { name: 'Krishna', passType: 'S Pass', daysLeft: 67, initials: 'K', color: '#5856D6', bg: '#F2F2FB' },
  { name: 'Aryan M.', passType: 'Work Permit', daysLeft: 14, initials: 'A', color: '#34C759', bg: '#E5F9EC' },
  { name: 'Liu Wei', passType: 'EP Holder', daysLeft: 5, initials: 'L', color: '#007AFF', bg: '#E5F1FF' },
];

export default function HomeExpiryAlerts() {
  return (
    <div className="mb-6">
      <h2 className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-2.5 ml-1 uppercase tracking-wide">Expiry Alerts</h2>
      <div className="bg-[#F8F9FA] dark:bg-[#121217] rounded-[16px] p-3 flex gap-3 overflow-x-auto">
        {alerts.map((a) => {
          return (
            <div
              key={a.name}
              className="bg-white dark:bg-[#1C1C22] rounded-[16px] p-3.5 flex flex-col items-center text-center shrink-0 w-[110px] relative border border-transparent dark:border-[#2A2A31]"
              style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
            >
              {/* Arrow */}
              <button className="absolute top-2 right-2 text-[var(--user-accent)] hover:opacity-70 transition-opacity">
                <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
              </button>

              {/* Avatar */}
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center text-[17px] font-bold text-white mb-2.5 shrink-0"
                style={{
                  backgroundColor: a.color,
                }}
              >
                {a.initials}
              </div>

              {/* Name */}
              <p className="text-[12px] font-semibold text-gray-900 dark:text-white leading-tight w-full truncate">{a.name}</p>
              {/* Pass type */}
              <p className="text-[10.5px] text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">{a.passType}</p>

              {/* Days pill */}
              <div
                className="mt-2.5 px-2.5 py-1 rounded-full text-[11px] font-bold border-[1.5px]"
                style={{ 
                  backgroundColor: 'color-mix(in srgb, var(--user-accent) 15%, transparent)', 
                  color: 'var(--user-accent)', 
                  borderColor: 'color-mix(in srgb, var(--user-accent) 30%, transparent)' 
                }}
              >
                {a.daysLeft}d left
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
