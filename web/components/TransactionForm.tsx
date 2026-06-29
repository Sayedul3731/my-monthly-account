"use client";

import { useState } from "react";
import {
  createTransaction,
  updateTransaction,
} from "@/lib/api";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CATEGORY_ICONS,
  monthDateBounds,
  toDateInputValue,
  type Transaction,
  type TransactionType,
} from "@/lib/finance";
import { CloseIcon } from "./icons";

type FormMode = "create" | "edit";

type Props = {
  year: number;
  month: number;
  editing: Transaction | null;
  onSaved: (transaction: Transaction, navigatedMonth?: { year: number; month: number }) => void;
  onCancelEdit: () => void;
  onError: (message: string) => void;
};

export default function TransactionForm({
  year,
  month,
  editing,
  onSaved,
  onCancelEdit,
  onError,
}: Props) {
  const mode: FormMode = editing ? "edit" : "create";
  const bounds = monthDateBounds(year, month);
  const defaultDate =
    mode === "edit" && editing
      ? toDateInputValue(new Date(editing.date))
      : bounds.max >= toDateInputValue(new Date()) && bounds.min <= toDateInputValue(new Date())
        ? toDateInputValue(new Date())
        : bounds.max;

  const [type, setType] = useState<TransactionType>(
    editing?.type ?? "expense",
  );
  const [amount, setAmount] = useState(
    editing ? String(editing.amount) : "",
  );
  const [description, setDescription] = useState(editing?.description ?? "");
  const [category, setCategory] = useState(
    editing?.category ??
      (editing?.type === "income"
        ? INCOME_CATEGORIES[0]
        : EXPENSE_CATEGORIES[0]),
  );
  const [date, setDate] = useState(defaultDate);
  const [submitting, setSubmitting] = useState(false);

  const categories =
    type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function handleTypeChange(next: TransactionType) {
    setType(next);
    setCategory(next === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0 || !description.trim()) return;

    setSubmitting(true);

    try {
      const payload = {
        type,
        amount: parsed,
        description: description.trim(),
        category,
        date: new Date(`${date}T12:00:00`).toISOString(),
      };

      const entry =
        mode === "edit" && editing
          ? await updateTransaction(editing.id, payload)
          : await createTransaction(payload);

      const txDate = new Date(entry.date);
      const txYear = txDate.getFullYear();
      const txMonth = txDate.getMonth();

      if (mode === "create") {
        setAmount("");
        setDescription("");
        setDate(
          bounds.max >= toDateInputValue(new Date()) &&
            bounds.min <= toDateInputValue(new Date())
            ? toDateInputValue(new Date())
            : bounds.max,
        );
      }

      onSaved(
        entry,
        txYear !== year || txMonth !== month
          ? { year: txYear, month: txMonth }
          : undefined,
      );
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Failed to save transaction",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
          {mode === "edit" ? "Edit transaction" : "Add transaction"}
        </h2>
        {mode === "edit" && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Cancel edit"
          >
            <CloseIcon />
          </button>
        )}
      </div>

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
              htmlFor="date"
              className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
            >
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              min={bounds.min}
              max={bounds.max}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
          {submitting
            ? "Saving..."
            : mode === "edit"
              ? "Save changes"
              : `Add ${type}`}
        </button>
      </form>
    </section>
  );
}
