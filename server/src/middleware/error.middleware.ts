import { Request, Response, NextFunction } from "express";

export interface ApiErrorResponse {
  error: string;
  details?: any;
}

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Error:", err);

  // Handle Prisma errors
  if (err.code && err.code.startsWith("P")) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error: "Resource already exists",
        details: err.meta,
      } as ApiErrorResponse);
    }
    if (err.code === "P2025") {
      return res.status(404).json({
        error: "Resource not found",
      } as ApiErrorResponse);
    }
  }

  // Handle generic errors
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500
    ? "Internal server error"
    : err.message || "Internal server error";

  return res.status(statusCode).json({
    error: message,
  } as ApiErrorResponse);
}
