import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma";
import { signToken } from "../utils/jwt";
import { RegisterInput, LoginInput } from "../routes/auth.schemas";

export async function register(input: RegisterInput) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    const error = new Error("Email already in use") as any;
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(input.password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      baseCurrency: true,
      createdAt: true,
    },
  });

  // Generate token
  const token = signToken({
    userId: user.id,
  });

  return { user, token };
}

export async function login(input: LoginInput) {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(input.password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Generate token
  const token = signToken({
    userId: user.id,
  });

  const userWithoutPassword = {
    id: user.id,
    name: user.name,
    email: user.email,
    baseCurrency: user.baseCurrency,
    createdAt: user.createdAt,
  };

  return { user: userWithoutPassword, token };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      baseCurrency: true,
      createdAt: true,
    },
  });

  if (!user) {
    const error = new Error("Authentication required") as any;
    error.statusCode = 401;
    throw error;
  }

  return user;
}
