import { Router } from "express";
import {
  listAccountsHandler,
  createAccountHandler,
  updateAccountHandler,
  deleteAccountHandler,
} from "../controllers/account.controller";
import { validateMiddleware } from "../middleware/validate.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import { createAccountSchema, updateAccountSchema } from "./account.schemas";

const router = Router();

// GET /accounts
router.get("/", authMiddleware, listAccountsHandler);

// POST /accounts
router.post(
  "/",
  authMiddleware,
  validateMiddleware(createAccountSchema),
  createAccountHandler
);

// PATCH /accounts/:id
router.patch(
  "/:id",
  authMiddleware,
  validateMiddleware(updateAccountSchema),
  updateAccountHandler
);

// DELETE /accounts/:id
router.delete("/:id", authMiddleware, deleteAccountHandler);

export default router;
