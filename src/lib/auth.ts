import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { User } from "./types";
import { create, getById, getAll, update } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "johnweb-secret-key-change-in-production";

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export function createUser(name: string, email: string, password: string): User {
  const user: User = {
    id: uuidv4(),
    name,
    email,
    password: hashPassword(password),
    role: "user",
    createdAt: new Date().toISOString(),
  };
  return create<User>("users.json", user);
}

export function getUserByEmail(email: string): User | undefined {
  return getAll<User>("users.json").find((u) => u.email === email);
}

export function getUserById(id: string): User | undefined {
  return getById<User>("users.json", id);
}
