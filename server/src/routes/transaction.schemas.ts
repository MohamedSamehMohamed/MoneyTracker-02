import { z } from "zod";

export const createTransactionSchema = z.object({
  accountId: z.string().uuid(),
  type: z.enum(["income", "expense", "transfer"]),
  amount: z.number().int().positive(),
  categoryId: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(
      (date) => {
        const selected = new Date(date + "T00:00:00Z");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selected <= today;
      },
      { message: "Date cannot be in the future" }
    ),
  transferToId: z.string().uuid().optional(),
}).refine(
  (data) => {
    if (data.type === "transfer" && !data.transferToId) {
      return false;
    }
    return true;
  },
  {
    message: "transferToId is required for transfer transactions",
    path: ["transferToId"],
  }
);

export const updateTransactionSchema = z.object({
  amount: z.number().int().positive().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(
      (date) => {
        const selected = new Date(date + "T00:00:00Z");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selected <= today;
      },
      { message: "Date cannot be in the future" }
    )
    .optional(),
});

export const listTransactionsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  type: z.enum(["income", "expense", "transfer"]).optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  convertToBase: z.enum(["true", "false"]).optional(),
});

export const exportTransactionsSchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  type: z.enum(["income", "expense", "transfer"]).optional(),
}).refine(
  (data) => {
    return new Date(data.dateFrom) <= new Date(data.dateTo);
  },
  {
    message: "dateTo must be greater than or equal to dateFrom",
    path: ["dateTo"],
  }
);

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsSchema>;
export type ExportTransactionsQuery = z.infer<typeof exportTransactionsSchema>;
