import { z } from "zod";

export const spendingChartSchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});

export const categorySummarySchema = z.object({
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  type: z.enum(["income", "expense"]).optional().default("expense"),
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return new Date(data.dateFrom) <= new Date(data.dateTo);
    }
    return true;
  },
  {
    message: "dateTo must be greater than or equal to dateFrom",
    path: ["dateTo"],
  }
);

export const incomeVsExpenseSchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});

export const netWorthHistorySchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  granularity: z.enum(["daily", "weekly", "monthly", "auto"]).optional().default("auto"),
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return new Date(data.dateFrom) <= new Date(data.dateTo);
    }
    return true;
  },
  {
    message: "dateTo must be greater than or equal to dateFrom",
    path: ["dateTo"],
  }
);

export type SpendingChartQuery = z.infer<typeof spendingChartSchema>;
export type CategorySummaryQuery = z.infer<typeof categorySummarySchema>;
export type IncomeVsExpenseQuery = z.infer<typeof incomeVsExpenseSchema>;
export type NetWorthHistoryQuery = z.infer<typeof netWorthHistorySchema>;
