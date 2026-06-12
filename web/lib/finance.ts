export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: string;
};

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investment",
  "Gift",
  "Other",
] as const;

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Bills",
  "Shopping",
  "Health",
  "Entertainment",
  "Other",
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  Salary: "💼",
  Freelance: "🖥️",
  Investment: "📈",
  Gift: "🎁",
  Food: "🍽️",
  Transport: "🚗",
  Bills: "📄",
  Shopping: "🛍️",
  Health: "💊",
  Entertainment: "🎬",
  Other: "📌",
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month));
}

export function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function isInMonth(date: string, year: number, month: number): boolean {
  const parsed = new Date(date);
  return parsed.getFullYear() === year && parsed.getMonth() === month;
}

export function summarize(transactions: Transaction[]) {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    income,
    expenses,
    balance: income - expenses,
    savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
  };
}

export function createId(): string {
  return crypto.randomUUID();
}
