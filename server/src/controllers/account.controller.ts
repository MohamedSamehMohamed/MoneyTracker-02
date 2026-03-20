import { Request, Response, NextFunction } from "express";
import {
  listAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from "../services/account.service";
import { CreateAccountInput, UpdateAccountInput } from "../routes/account.schemas";

export async function listAccountsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const accounts = await listAccounts(req.userId);
    return res.status(200).json({ accounts });
  } catch (error) {
    next(error);
  }
}

export async function createAccountHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const input = req.body as CreateAccountInput;
    const account = await createAccount(req.userId, input);
    return res.status(201).json({ account });
  } catch (error) {
    next(error);
  }
}

export async function updateAccountHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const { id } = req.params;
    const input = req.body as UpdateAccountInput;
    const account = await updateAccount(req.userId, id, input);
    return res.status(200).json({ account });
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

export async function deleteAccountHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const { id } = req.params;
    await deleteAccount(req.userId, id);
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
