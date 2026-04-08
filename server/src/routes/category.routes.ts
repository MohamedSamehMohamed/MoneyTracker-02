import { Router } from "express";
import {
  listCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
} from "../controllers/category.controller";
import { validateMiddleware } from "../middleware/validate.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import { createCategorySchema, updateCategorySchema } from "./category.schemas";

const router = Router();

// GET /categories
router.get("/", authMiddleware, listCategoriesHandler);

// POST /categories
router.post(
  "/",
  authMiddleware,
  validateMiddleware(createCategorySchema),
  createCategoryHandler
);

// PATCH /categories/:id
router.patch(
  "/:id",
  authMiddleware,
  validateMiddleware(updateCategorySchema),
  updateCategoryHandler
);

// DELETE /categories/:id
router.delete("/:id", authMiddleware, deleteCategoryHandler);

export default router;
