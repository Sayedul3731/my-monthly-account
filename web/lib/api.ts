import type { Transaction, TransactionType } from "./finance";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type CreateTransactionInput = {
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: string;
};

type UpdateTransactionInput = Partial<CreateTransactionInput>;

export type Budget = {
  id: string;
  year: number;
  month: number;
  category: string;
  amount: number;
};

type UpsertBudgetInput = {
  year: number;
  month: number;
  category?: string | null;
  amount: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function normalizeTransaction(raw: Transaction): Transaction {
  return {
    ...raw,
    amount: Number(raw.amount),
    date: new Date(raw.date).toISOString(),
  };
}

function normalizeBudget(raw: Budget): Budget {
  return {
    ...raw,
    amount: Number(raw.amount),
  };
}

export async function fetchTransactions(
  year: number,
  month: number,
): Promise<Transaction[]> {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
  });
  const data = await request<Transaction[]>(`/transactions?${params}`);
  return data.map(normalizeTransaction);
}

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<Transaction> {
  const data = await request<Transaction>("/transactions", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return normalizeTransaction(data);
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<Transaction> {
  const data = await request<Transaction>(`/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return normalizeTransaction(data);
}

export async function deleteTransaction(id: string): Promise<void> {
  await request<void>(`/transactions/${id}`, { method: "DELETE" });
}

export async function fetchBudgets(
  year: number,
  month: number,
): Promise<Budget[]> {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
  });
  const data = await request<Budget[]>(`/budgets?${params}`);
  return data.map(normalizeBudget);
}

export async function upsertBudget(
  input: UpsertBudgetInput,
): Promise<Budget> {
  const data = await request<Budget>("/budgets", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return normalizeBudget(data);
}

export async function deleteBudget(id: string): Promise<void> {
  await request<void>(`/budgets/${id}`, { method: "DELETE" });
}

export async function importTransactions(
  items: CreateTransactionInput[],
): Promise<Transaction[]> {
  const results: Transaction[] = [];
  for (const item of items) {
    results.push(await createTransaction(item));
  }
  return results;
}

export function exportTransactionsJson(transactions: Transaction[]): string {
  return JSON.stringify(transactions, null, 2);
}

export function exportTransactionsCsv(transactions: Transaction[]): string {
  const header = "date,type,category,description,amount";
  const rows = transactions.map((t) => {
    const date = t.date.slice(0, 10);
    const desc = `"${t.description.replace(/"/g, '""')}"`;
    return `${date},${t.type},${t.category},${desc},${t.amount}`;
  });
  return [header, ...rows].join("\n");
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function parseImportJson(raw: string): CreateTransactionInput[] {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Import file must be a JSON array of transactions");
  }

  return parsed.map((item, index) => {
    if (
      typeof item !== "object" ||
      item === null ||
      !("type" in item) ||
      !("amount" in item) ||
      !("description" in item) ||
      !("category" in item) ||
      !("date" in item)
    ) {
      throw new Error(`Invalid transaction at index ${index}`);
    }

    const record = item as Record<string, unknown>;
    return {
      type: record.type as TransactionType,
      amount: Number(record.amount),
      description: String(record.description),
      category: String(record.category),
      date: new Date(String(record.date)).toISOString(),
    };
  });
}

export function parseImportCsv(raw: string): CreateTransactionInput[] {
  const lines = raw.trim().split(/\r?\n/);
  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one transaction");
  }

  const header = lines[0].toLowerCase();
  if (!header.includes("date") || !header.includes("amount")) {
    throw new Error("CSV must include date, type, category, description, and amount columns");
  }

  return lines.slice(1).filter(Boolean).map((line, index) => {
    const match = line.match(
      /^([^,]+),([^,]+),([^,]+),("(?:[^"]|"")*"|[^,]*),([^,]+)$/,
    );
    if (!match) {
      throw new Error(`Invalid CSV row at line ${index + 2}`);
    }

    const [, date, type, category, description, amount] = match;
    const cleanDescription = description.startsWith('"')
      ? description.slice(1, -1).replace(/""/g, '"')
      : description;

    return {
      type: type as TransactionType,
      amount: parseFloat(amount),
      description: cleanDescription,
      category,
      date: new Date(date).toISOString(),
    };
  });
}
