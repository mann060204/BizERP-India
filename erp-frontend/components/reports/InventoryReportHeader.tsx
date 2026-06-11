import React from 'react';

interface SummaryCard {
  label: string;
  value: string | number;
  highlight?: boolean;
}

interface InventoryReportHeaderProps {
  summaryCards?: SummaryCard[];
  filters?: React.ReactNode;
}

export default function InventoryReportHeader({ summaryCards, filters }: InventoryReportHeaderProps) {
  return (
    <div className="w-full flex flex-col gap-4">
      {filters && (
        <div className="flex items-center gap-3">
          {filters}
        </div>
      )}
      {summaryCards && summaryCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, i) => (
            <div key={i} className={`p-4 rounded-xl border ${card.highlight ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-white border-slate-200'}`}>
              <div className="text-xs font-medium text-slate-500 mb-1">{card.label}</div>
              <div className={`text-xl font-bold ${card.highlight ? 'text-orange-700' : 'text-slate-800'}`}>
                {card.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
