import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";

export async function listCategoriesHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { type } = req.query;

    const where: any = {
      OR: [
        { userId: null }, // System default categories
        { userId: req.userId }, // User custom categories
      ],
    };

    // Only apply type filter if it's a valid value
    if (type && (type === "income" || type === "expense")) {
      where.type = type;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ userId: "asc" }, { name: "asc" }],
    });

    return res.status(200).json({ categories });
  } catch (error) {
    next(error);
  }
}
