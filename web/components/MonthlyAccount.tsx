"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createTransaction,
  deleteTransaction,
  fetchTransactions,
} from "@/lib/api";
import {
  CATEGORY_ICONS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  formatCurrency,
  formatMonthLabel,
  summarize,
  type Transaction,
  type TransactionType,
} from "@/lib/finance";

const today = new Date();

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MonthlyAccount() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchTransactions(year, month);
        if (!cancelled) setTransactions(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load transactions",
          );
          setTransactions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [year, month]);

  const monthTransactions = transactions;

  const stats = useMemo(() => summarize(monthTransactions), [monthTransactions]);

  const expenseShare =
    stats.income > 0 ? Math.min((stats.expenses / stats.income) * 100, 100) : 0;

  const categories =
    type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function changeMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  function handleTypeChange(next: TransactionType) {
    setType(next);
    setCategory(
      next === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0 || !description.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const entry = await createTransaction({
        type,
        amount: parsed,
        description: description.trim(),
        category,
        date: new Date(year, month, today.getDate()).toISOString(),
      });

      setTransactions((prev) => [entry, ...prev]);
      setAmount("");
      setDescription("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add transaction",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function removeTransaction(id: string) {
    setError(null);

    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete transaction",
      );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Monthly Tracker
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            My Account
          </h1>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="Previous month"
          >
            <ChevronLeft />
          </button>
          <span className="min-w-[9rem] px-2 text-center text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {formatMonthLabel(year, month)}
          </span>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="Next month"
          >
            <ChevronRight />
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
          {error}
        </div>
      )}

      <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-xl shadow-emerald-500/20">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

        <p className="text-sm font-medium text-emerald-100">Net Balance</p>
        <p className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">
          {formatCurrency(stats.balance)}
        </p>
        <p className="mt-2 text-sm text-emerald-100/90">
          {stats.balance >= 0 ? "You're in the green" : "Spending exceeds income"}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-100">
              Income
            </p>
            <p className="mt-1 text-lg font-semibold">
              {formatCurrency(stats.income)}
            </p>
          </div>
          <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-100">
              Expenses
            </p>
            <p className="mt-1 text-lg font-semibold">
              {formatCurrency(stats.expenses)}
            </p>
          </div>
        </div>

        {stats.income > 0 && (
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between text-xs text-emerald-100">
              <span>Spent of income</span>
              <span>{expenseShare.toFixed(0)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${expenseShare}%` }}
              />
            </div>
          </div>
        )}
      </section>

      <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-white">
          Add transaction
        </h2>

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
          {(["expense", "income"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleTypeChange(option)}
              className={`rounded-lg py-2.5 text-sm font-semibold capitalize transition ${
                type === option
                  ? option === "income"
                    ? "bg-white text-emerald-700 shadow-sm dark:bg-zinc-900 dark:text-emerald-400"
                    : "bg-white text-rose-600 shadow-sm dark:bg-zinc-900 dark:text-rose-400"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="amount"
                className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
              >
                Amount
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  $
                </span>
                <input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-8 pr-4 text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
              >
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_ICONS[cat]} {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
            >
              Description
            </label>
            <input
              id="description"
              type="text"
              placeholder="e.g. Grocery run, paycheck..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full rounded-xl py-3.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${
              type === "income"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-rose-500 hover:bg-rose-600"
            }`}
          >
            {submitting ? "Saving..." : `Add ${type}`}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
            Transactions
          </h2>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {monthTransactions.length}
          </span>
        </div>

        {monthTransactions.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-2xl dark:bg-zinc-800">
              📊
            </div>
            <p className="font-medium text-zinc-700 dark:text-zinc-300">
              No transactions yet
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Add your first income or expense above to start tracking.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {monthTransactions.map((t) => (
              <li
                key={t.id}
                className="group flex items-center gap-4 px-5 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${
                    t.type === "income"
                      ? "bg-emerald-50 dark:bg-emerald-950/50"
                      : "bg-rose-50 dark:bg-rose-950/50"
                  }`}
                >
                  {CATEGORY_ICONS[t.category] ?? "📌"}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-zinc-900 dark:text-white">
                    {t.description}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {t.category} ·{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                    }).format(new Date(t.date))}
                  </p>
                </div>

                <p
                  className={`shrink-0 font-semibold tabular-nums ${
                    t.type === "income"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </p>

                <button
                  type="button"
                  onClick={() => removeTransaction(t.id)}
                  className="shrink-0 rounded-lg p-2 text-zinc-400 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                  aria-label={`Delete ${t.description}`}
                >
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
