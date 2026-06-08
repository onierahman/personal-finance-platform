'use client';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface CategoryPickerProps {
  type:     'expense' | 'income';
  value:    string;
  onChange: (category: string) => void;
}

export function CategoryPicker({ type, value, onChange }: CategoryPickerProps) {
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
      {categories.map(cat => {
        const selected = value === cat.name;
        return (
          <button
            key={cat.name}
            type="button"
            onClick={() => onChange(cat.name)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-md border transition-all text-center',
              selected
                ? 'border-transparent ring-2 shadow-sm'
                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50',
            )}
            style={selected ? {
              background:  cat.color + '18',
              ringColor:   cat.color,
              outlineColor: cat.color,
              outline: `2px solid ${cat.color}`,
              outlineOffset: '1px',
            } : {}}
          >
            <span className="text-xl leading-none">{cat.icon}</span>
            <span className="text-[10px] font-medium text-slate-600 leading-tight">{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
