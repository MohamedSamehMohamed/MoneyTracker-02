import { Request, Response, NextFunction } from "express";
import {
  getMonthlyTotals,
  getCategorySummary,
  getIncomeVsExpense,
} from "../services/dashboard.service";
import { SpendingChartQuery, CategorySummaryQuery, IncomeVsExpenseQuery } from "../routes/dashboard.schemas";

export async function getSpendingChartHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const query = req.query as unknown as SpendingChartQuery;
    const result = await getMonthlyTotals(req.userId, query.months);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getCategorySummaryHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const query = req.query as CategorySummaryQuery;
    const result = await getCategorySummary(
      req.userId,
      query.dateFrom,
      query.dateTo
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getIncomeVsExpenseHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const query = req.query as unknown as IncomeVsExpenseQuery;
    const result = await getIncomeVsExpense(req.userId, query.months);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
