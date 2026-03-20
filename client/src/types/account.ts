export type AccountType = "cash" | "bank" | "wallet" | "gold";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currency: string;
  icon?: string;
}

export interface UpdateAccountInput {
  name?: string;
  icon?: string;
}
