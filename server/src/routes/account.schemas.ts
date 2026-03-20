import { z } from "zod";

export const createAccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["cash", "bank", "wallet", "gold"]),
  currency: z.enum(["EGP", "USD", "EUR", "GOLD_GRAM"]),
  icon: z.string().max(50).optional(),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().max(50).optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
