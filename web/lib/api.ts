import type { Transaction, TransactionType } from "./finance";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type CreateTransactionInput = {
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: string;
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

export async function deleteTransaction(id: string): Promise<void> {
  await request<void>(`/transactions/${id}`, { method: "DELETE" });
}
