import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "./database";
import type { User } from "./database";

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateJWT(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyJWT(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };
  } catch {
    return null;
  }
}

export async function createUser(
  email: string,
  password: string,
  name?: string
): Promise<User> {
  const passwordHash = await hashPassword(password);

  try {
    const result = await query(
      `INSERT INTO users (email, password_hash, name) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [email, passwordHash, name]
    );

    if (result.rows.length === 0) {
      throw new Error("Failed to create user");
    }

    return result.rows[0];
  } catch (error: any) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthUser | null> {
  try {
    const result = await query("SELECT * FROM users WHERE email = $1 LIMIT 1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  try {
    const result = await query(
      "SELECT id, email, name FROM users WHERE id = $1 LIMIT 1",
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error("Get user by ID error:", error);
    return null;
  }
}

export async function initializeDefaultUser(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn(
      "ADMIN_EMAIL and ADMIN_PASSWORD not set. Skipping default user creation."
    );
    return;
  }

  try {
    // Check if user already exists
    const result = await query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [adminEmail]
    );

    if (result.rows.length > 0) {
      console.log("Default admin user already exists");
      return;
    }

    await createUser(adminEmail, adminPassword, "Admin");
    console.log("Default admin user created successfully");
  } catch (error) {
    console.error("Failed to create default admin user:", error);
  }
}
