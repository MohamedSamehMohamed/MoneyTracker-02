import { Request, Response, NextFunction } from "express";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/category.service";
import { CreateCategoryInput, UpdateCategoryInput } from "../routes/category.schemas";

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
    const validTypes = ['income', 'expense'];
    const categoryType = typeof type === 'string' && validTypes.includes(type)
      ? (type as 'income' | 'expense')
      : undefined;
    const categories = await listCategories(
      req.userId,
      categoryType
    );

    return res.status(200).json({ categories });
  } catch (error) {
    next(error);
  }
}

export async function createCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const input = req.body as CreateCategoryInput;
    const category = await createCategory(req.userId, input);
    return res.status(201).json({ category });
  } catch (error: any) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    if (error.statusCode === 409) {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
}

export async function updateCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const { id } = req.params;
    const input = req.body as UpdateCategoryInput;
    const category = await updateCategory(req.userId, id, input);
    return res.status(200).json({ category });
  } catch (error: any) {
    if (error.statusCode === 403) {
      return res.status(403).json({ error: error.message });
    }
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    if (error.statusCode === 409) {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
}

export async function deleteCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const { id } = req.params;
    await deleteCategory(req.userId, id);
    return res.status(204).send();
  } catch (error: any) {
    if (error.statusCode === 403) {
      return res.status(403).json({ error: error.message });
    }
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    if (error.statusCode === 409) {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
}
