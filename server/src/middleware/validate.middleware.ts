import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validateMiddleware(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        return res.status(400).json({
          error: "Validation failed",
          details: errors,
        });
      }
      return res.status(400).json({ error: "Invalid request body" });
    }
  };
}
