'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { DEMO_CATEGORIES, type DemoTxn } from './demoData';

let counter = 1000;

/**
 * Interactive add form for the demo. Fully client-side — builds a DemoTxn and
 * hands it up so the dashboard summary and budgets react instantly.
 */
export function DemoQuickAdd({ onAdd }: { onAdd: (t: DemoTxn) => void }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(DEMO_CATEGORIES[0]);
  const [justAdded, setJustAdded] = useState(false);

  const submit = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return;
    onAdd({
      id: `demo-${counter++}`,
      merchant: `${category.name} purchase`,
      category: category.name,
      icon: category.icon,
      amount: Math.round(value * 100) / 100,
      type: 'expense',
      date: new Date().toISOString().slice(0, 10),
    });
    setAmount('');
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <div className="card p-4">
      <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Add an expense</p>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="0.00"
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <button
          onClick={submit}
          disabled={!amount}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-700 active:scale-[0.97] disabled:opacity-50"
        >
          {justAdded ? <Check size={16} /> : <Plus size={16} />}
          {justAdded ? 'Added' : 'Add'}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {DEMO_CATEGORIES.map((c) => (
          <button
            key={c.name}
            onClick={() => setCategory(c)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              category.name === c.name
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      <motion.p
        initial={false}
        animate={{ opacity: justAdded ? 1 : 0 }}
        className="mt-2 text-[11px] font-medium text-success-600 dark:text-success-400"
      >
        Logged — watch your budget update on the left.
      </motion.p>
    </div>
  );
}
