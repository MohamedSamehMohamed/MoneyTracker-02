import { Request, Response, NextFunction } from "express";
import {
  createStockTransaction,
  listStockTransactions,
  getStockTransaction,
  updateStockTransaction,
  deleteStockTransaction,
  getPortfolio,
} from "../services/stock.service";
import {
  CreateStockTransactionInput,
  UpdateStockTransactionInput,
  ListStockTransactionsQuery,
} from "../routes/stock.schemas";

export async function createHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const input = req.body as CreateStockTransactionInput;
    const transaction = await createStockTransaction(req.userId, input);
    return res.status(201).json({ transaction });
  } catch (error: any) {
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
}

export async function listHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const filters = req.query as any as ListStockTransactionsQuery;
    const result = await listStockTransactions(req.userId, filters);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const { id } = req.params;
    const transaction = await getStockTransaction(req.userId, id);
    return res.status(200).json({ transaction });
  } catch (error: any) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
}

export async function updateHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const { id } = req.params;
    const input = req.body as UpdateStockTransactionInput;
    const transaction = await updateStockTransaction(req.userId, id, input);
    return res.status(200).json({ transaction });
  } catch (error: any) {
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
}

export async function deleteHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const { id } = req.params;
    await deleteStockTransaction(req.userId, id);
    return res.status(204).send();
  } catch (error: any) {
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
}

export async function portfolioHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const portfolio = await getPortfolio(req.userId);
    return res.status(200).json(portfolio);
  } catch (error) {
    next(error);
  }
}
