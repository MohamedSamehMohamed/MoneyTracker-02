import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validateMiddleware(
  schema: ZodSchema,
  source: "body" | "query" = "body"
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = source === "query" ? req.query : req.body;
      const validatedData = await schema.parseAsync(dataToValidate);

      if (source === "query") {
        req.query = validatedData as any;
      } else {
        req.body = validatedData;
      }

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
      return res.status(400).json({
        error: `Invalid ${source}`,
      });
    }
  };
}
