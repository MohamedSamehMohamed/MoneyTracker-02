import { Router } from "express";
import {
  getSpendingChartHandler,
  getCategorySummaryHandler,
  getIncomeVsExpenseHandler,
} from "../controllers/dashboard.controller";
import { validateMiddleware } from "../middleware/validate.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  spendingChartSchema,
  categorySummarySchema,
  incomeVsExpenseSchema,
} from "./dashboard.schemas";

const router = Router();

router.get(
  "/spending-chart",
  authMiddleware,
  validateMiddleware(spendingChartSchema, "query"),
  getSpendingChartHandler
);

router.get(
  "/category-summary",
  authMiddleware,
  validateMiddleware(categorySummarySchema, "query"),
  getCategorySummaryHandler
);

router.get(
  "/income-vs-expense",
  authMiddleware,
  validateMiddleware(incomeVsExpenseSchema, "query"),
  getIncomeVsExpenseHandler
);

export default router;
