import { Router } from "express";
import {
  registerHandler,
  loginHandler,
  getMeHandler,
  updateProfileHandler,
} from "../controllers/auth.controller";
import { validateMiddleware } from "../middleware/validate.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import { registerSchema, loginSchema, updateProfileSchema } from "./auth.schemas";

const router = Router();

// POST /auth/register
router.post(
  "/register",
  validateMiddleware(registerSchema),
  registerHandler
);

// POST /auth/login
router.post(
  "/login",
  validateMiddleware(loginSchema),
  loginHandler
);

// GET /auth/me
router.get(
  "/me",
  authMiddleware,
  getMeHandler
);

// PATCH /auth/me
router.patch(
  "/me",
  authMiddleware,
  validateMiddleware(updateProfileSchema),
  updateProfileHandler
);

export default router;
