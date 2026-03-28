import { z } from "zod";

const currencyCodeSchema = z.string().min(3).max(4).regex(/^[A-Za-z]{3,4}$/).transform(s => s.toUpperCase());

export const setOverrideSchema = z.object({
  fromCurrency: currencyCodeSchema,
  toCurrency: currencyCodeSchema,
  rate: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Rate must be a positive number",
  }),
});

export const removeOverrideSchema = z.object({
  fromCurrency: currencyCodeSchema,
  toCurrency: currencyCodeSchema,
});

export const convertQuerySchema = z.object({
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Amount must be a non-negative number",
  }),
  from: currencyCodeSchema,
  to: currencyCodeSchema,
  date: z.string().refine(val => !isNaN(new Date(val).getTime()), "Invalid date").optional(),
});

export const currencyPairSchema = z.object({
  fromCurrency: currencyCodeSchema,
  toCurrency: currencyCodeSchema,
});

export type SetOverrideInput = z.infer<typeof setOverrideSchema>;
export type RemoveOverrideInput = z.infer<typeof removeOverrideSchema>;
export type ConvertQueryInput = z.infer<typeof convertQuerySchema>;
export type CurrencyPairInput = z.infer<typeof currencyPairSchema>;
