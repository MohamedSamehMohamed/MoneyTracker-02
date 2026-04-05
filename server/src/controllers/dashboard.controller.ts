import { Request, Response, NextFunction } from "express";
import {
  getMonthlyTotals,
  getCategorySummary,
  getIncomeVsExpense,
  getNetWorthHistory,
} from "../services/dashboard.service";
import { SpendingChartQuery, CategorySummaryQuery, IncomeVsExpenseQuery, NetWorthHistoryQuery } from "../routes/dashboard.schemas";

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
      query.dateTo,
      query.type
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

export async function getNetWorthHistoryHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const query = req.query as NetWorthHistoryQuery;
    const result = await getNetWorthHistory(
      req.userId,
      query.dateFrom,
      query.dateTo,
      query.granularity
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
