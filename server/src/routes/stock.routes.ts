import { Router } from "express";
import {
  createHandler,
  listHandler,
  getHandler,
  updateHandler,
  deleteHandler,
  portfolioHandler,
  setCurrentPriceHandler,
} from "../controllers/stock.controller";
import { validateMiddleware } from "../middleware/validate.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createStockTransactionSchema,
  updateStockTransactionSchema,
  listStockTransactionsSchema,
  setCurrentPriceSchema,
} from "./stock.schemas";

const router = Router();

// GET /api/stocks
router.get(
  "/",
  authMiddleware,
  validateMiddleware(listStockTransactionsSchema, "query"),
  listHandler
);

// GET /api/stocks/portfolio
router.get("/portfolio", authMiddleware, portfolioHandler);

// PUT /api/stocks/current-price
router.put(
  "/current-price",
  authMiddleware,
  validateMiddleware(setCurrentPriceSchema),
  setCurrentPriceHandler
);

// GET /api/stocks/:id
router.get("/:id", authMiddleware, getHandler);

// POST /api/stocks
router.post(
  "/",
  authMiddleware,
  validateMiddleware(createStockTransactionSchema),
  createHandler
);

// PATCH /api/stocks/:id
router.patch(
  "/:id",
  authMiddleware,
  validateMiddleware(updateStockTransactionSchema),
  updateHandler
);

// DELETE /api/stocks/:id
router.delete("/:id", authMiddleware, deleteHandler);

export default router;
