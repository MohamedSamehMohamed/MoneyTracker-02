import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const positiveNumberString = z.string().refine(
  (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
  "Must be a positive number"
);

const futureDate = (date: string) => {
  const selected = new Date(date + "T00:00:00Z");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected <= today;
};

export const createStockTransactionSchema = z.object({
  type: z.enum(["buy", "sell"]),
  company: z.string().min(1).max(100),
  shares: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.string())
    .pipe(positiveNumberString),
  pricePerShare: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.string())
    .pipe(positiveNumberString),
  currency: z.string().min(1).max(10),
  date: z
    .string()
    .regex(dateRegex, "Date must be in YYYY-MM-DD format")
    .refine(futureDate, { message: "Date cannot be in the future" }),
  note: z.string().max(500).optional(),
  accountId: z.string().uuid().optional(),
});

export const updateStockTransactionSchema = z.object({
  shares: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.string())
    .pipe(positiveNumberString)
    .optional(),
  pricePerShare: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.string())
    .pipe(positiveNumberString)
    .optional(),
  note: z.string().max(500).nullable().optional(),
  date: z
    .string()
    .regex(dateRegex, "Date must be in YYYY-MM-DD format")
    .refine(futureDate, { message: "Date cannot be in the future" })
    .optional(),
});

export const listStockTransactionsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  company: z.string().optional(),
  type: z.enum(["buy", "sell"]).optional(),
  dateFrom: z.string().regex(dateRegex, "Date must be in YYYY-MM-DD format").optional(),
  dateTo: z.string().regex(dateRegex, "Date must be in YYYY-MM-DD format").optional(),
});

export const setCurrentPriceSchema = z.object({
  company: z.string().min(1).max(100),
  price: z
    .union([z.string(), z.number()])
    .pipe(z.coerce.string())
    .pipe(positiveNumberString),
  currency: z.string().min(1).max(10),
});

export type CreateStockTransactionInput = z.infer<typeof createStockTransactionSchema>;
export type UpdateStockTransactionInput = z.infer<typeof updateStockTransactionSchema>;
export type ListStockTransactionsQuery = z.infer<typeof listStockTransactionsSchema>;
export type SetCurrentPriceInput = z.infer<typeof setCurrentPriceSchema>;
