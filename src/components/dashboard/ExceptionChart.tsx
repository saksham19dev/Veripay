import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';

interface ExceptionChartProps {
  data?: {
    duplicateInvoice: number;
    amountOverLimit: number;
    missingFields: number;
    incorrectTaxDetails: number;
    other: number;
  };
  totalExceptions?: number;
}

export const ExceptionChart: React.FC<ExceptionChartProps> = ({
  data = {
    duplicateInvoice: 8,
    amountOverLimit: 6,
    missingFields: 5,
    incorrectTaxDetails: 4,
    other: 3,
  },
  totalExceptions = 26,
}) => {
  const navigate = useNavigate();

  const chartData = [
    { name: 'Duplicate Invoice', value: data.duplicateInvoice, color: '#ef4444', filterType: 'duplicate_invoice' },
    { name: 'Amount > Policy Limit', value: data.amountOverLimit, color: '#f59e0b', filterType: 'policy_limit' },
    { name: 'Missing Fields', value: data.missingFields, color: '#8b5cf6', filterType: 'missing_fields' },
    { name: 'Incorrect Tax Details', value: data.incorrectTaxDetails, color: '#06b6d4', filterType: 'tax_mismatch' },
    { name: 'Other', value: data.other, color: '#3b82f6', filterType: 'other' },
  ];

  const handleSliceClick = (filterType: string) => {
    navigate(`/invoices?exceptionType=${filterType}`);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">
          Exception Breakdown
        </h3>
        <button
          onClick={() => navigate('/exceptions')}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All
        </button>
      </div>

      <div className="flex items-center justify-between gap-4 py-2">
        {/* Donut chart with centered text */}
        <div className="relative w-40 h-40 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                formatter={(value: any) => [`${value} Invoices`, 'Count']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
              />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                onClick={(entry: any) => handleSliceClick(entry?.filterType || 'all')}
                cursor="pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold text-slate-800 leading-none">
              {totalExceptions}
            </span>
            <span className="text-[11px] font-medium text-slate-400 mt-0.5">
              Exceptions
            </span>
          </div>
        </div>

        {/* Legend list on the right */}
        <div className="flex-1 space-y-2">
          {chartData.map((item) => (
            <div
              key={item.name}
              onClick={() => handleSliceClick(item.filterType)}
              className="flex items-center justify-between text-xs cursor-pointer group hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-600 truncate group-hover:text-slate-900 font-medium">
                  {item.name}
                </span>
              </div>
              <span className="font-bold text-slate-800 group-hover:text-blue-600">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
