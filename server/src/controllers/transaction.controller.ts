import { Request, Response, NextFunction } from "express";
import {
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../services/transaction.service";
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  ListTransactionsQuery,
} from "../routes/transaction.schemas";

export async function listTransactionsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const filters = req.query as any as ListTransactionsQuery;
    const result = await listTransactions(req.userId, filters);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getTransactionHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const { id } = req.params;
    const transaction = await getTransaction(req.userId, id);
    return res.status(200).json({ transaction });
  } catch (error: any) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
}

export async function createTransactionHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const input = req.body as CreateTransactionInput;
    const transaction = await createTransaction(req.userId, input);
    return res.status(201).json({ transaction });
  } catch (error: any) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
}

export async function updateTransactionHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const { id } = req.params;
    const input = req.body as UpdateTransactionInput;
    const transaction = await updateTransaction(req.userId, id, input);
    return res.status(200).json({ transaction });
  } catch (error: any) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
}

export async function deleteTransactionHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const { id } = req.params;
    await deleteTransaction(req.userId, id);
    return res.status(204).send();
  } catch (error: any) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
}
