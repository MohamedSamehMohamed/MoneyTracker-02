import { Router } from "express";
import { listCategoriesHandler } from "../controllers/category.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// GET /categories
router.get("/", authMiddleware, listCategoriesHandler);

export default router;
