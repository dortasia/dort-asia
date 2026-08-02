export default function Loading() {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto page-scrollbar">

      {/* Header skeleton */}
      <header className="flex items-center justify-between px-10 py-8">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-[17px] w-20 rounded-md" />
          <div className="skeleton h-[13px] w-44 rounded-md" />
        </div>
        <div className="flex-1 max-w-xl mx-8">
          <div className="skeleton h-[40px] w-full rounded-full" />
        </div>
        <div className="flex flex-col gap-2 items-end">
          <div className="skeleton h-[17px] w-36 rounded-md" />
          <div className="skeleton h-[13px] w-24 rounded-md" />
        </div>
      </header>

      <main className="flex-1 px-10 pb-8">

        {/* Heatmap card skeleton */}
        <div className="bg-white rounded-[24px] px-6 pt-4 pb-5 mb-10 border border-[#F3F4F6] shadow-sm w-full">
          {/* Month labels row */}
          <div className="flex gap-[6%] mb-3 pl-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton h-[12px] w-7 rounded" />
            ))}
          </div>
          {/* Grid rows */}
          <div className="flex items-start gap-3">
            {/* Day labels */}
            <div className="flex flex-col gap-[6px] pt-[2px]">
              {["Mon", "Wed", "Fri"].map((d, i) => (
                <div key={d} className="skeleton h-[13px] w-6 rounded" style={{ marginTop: i === 0 ? 0 : 20 }} />
              ))}
            </div>
            {/* Cell grid */}
            <div className="flex-1 flex flex-col gap-[4px]">
              {Array.from({ length: 7 }).map((_, row) => (
                <div key={row} className="flex gap-[4px]">
                  {Array.from({ length: 53 }).map((_, col) => (
                    <div
                      key={col}
                      className="skeleton rounded-[3px] shrink-0"
                      style={{ width: `calc((100% - ${52 * 4}px) / 53)`, aspectRatio: "1" }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expiry Alerts card skeleton */}
        <div className="mb-10">
          <div className="skeleton h-[16px] w-32 rounded-md mb-4 ml-1" />
          <div className="bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-7 gap-4 px-6 py-[18px] border-b border-[#E5E7EB]">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="skeleton h-[13px] rounded" />
              ))}
            </div>
            {/* Table rows */}
            {Array.from({ length: 5 }).map((_, row) => (
              <div key={row} className="grid grid-cols-7 gap-4 items-center px-6 py-4 border-b border-[#E5E7EB] last:border-b-0">
                {/* Name cell */}
                <div className="flex items-center gap-3">
                  <div className="skeleton h-9 w-9 rounded-full shrink-0" />
                  <div className="flex flex-col gap-1.5">
                    <div className="skeleton h-[12px] w-24 rounded" />
                    <div className="skeleton h-[10px] w-16 rounded" />
                  </div>
                </div>
                {/* Other cells */}
                {Array.from({ length: 6 }).map((_, col) => (
                  <div key={col} className="skeleton h-[12px] rounded" style={{ width: col === 5 ? "60%" : "80%" }} />
                ))}
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
