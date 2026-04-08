import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50).trim(),
  type: z.enum(["income", "expense"]),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
}).refine((data) => data.name !== undefined || data.icon !== undefined || data.color !== undefined, {
  message: "At least one field must be provided",
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
