import { Router } from "express";
import {
  listTransactionsHandler,
  getTransactionHandler,
  createTransactionHandler,
  updateTransactionHandler,
  deleteTransactionHandler,
} from "../controllers/transaction.controller";
import { validateMiddleware } from "../middleware/validate.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsSchema,
} from "./transaction.schemas";

const router = Router();

// GET /transactions
router.get(
  "/",
  authMiddleware,
  validateMiddleware(listTransactionsSchema, "query"),
  listTransactionsHandler
);

// GET /transactions/:id
router.get("/:id", authMiddleware, getTransactionHandler);

// POST /transactions
router.post(
  "/",
  authMiddleware,
  validateMiddleware(createTransactionSchema),
  createTransactionHandler
);

// PATCH /transactions/:id
router.patch(
  "/:id",
  authMiddleware,
  validateMiddleware(updateTransactionSchema),
  updateTransactionHandler
);

// DELETE /transactions/:id
router.delete("/:id", authMiddleware, deleteTransactionHandler);

export default router;
