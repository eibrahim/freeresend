import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "./supabase";
import type { User } from "./supabase";

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

  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({
      email,
      password_hash: passwordHash,
      name,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return data;
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthUser | null> {
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !user) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, email, name")
    .eq("id", id)
    .single();

  if (error || !user) {
    return null;
  }

  return user;
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

  // Check if user already exists
  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", adminEmail)
    .single();

  if (existingUser) {
    console.log("Default admin user already exists");
    return;
  }

  try {
    await createUser(adminEmail, adminPassword, "Admin");
    console.log("Default admin user created successfully");
  } catch (error) {
    console.error("Failed to create default admin user:", error);
  }
}
