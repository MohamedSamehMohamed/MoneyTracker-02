import { Request, Response, NextFunction } from "express";
import { register, login, getMe } from "../services/auth.service";
import { RegisterInput, LoginInput } from "../routes/auth.schemas";

export async function registerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as RegisterInput;
    const result = await register(input);
    return res.status(201).json(result);
  } catch (error: any) {
    if (error.statusCode === 409) {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as LoginInput;
    const result = await login(input);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(401).json({
      error: "Invalid email or password",
    });
  }
}

export async function getMeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const user = await getMe(req.userId);
    return res.status(200).json({ user });
  } catch (error: any) {
    next(error);
  }
}
