import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser, generateJWT } from "@/lib/auth";
import { withCors, validateRequest, handleError } from "@/lib/middleware";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

async function loginHandler(req: NextRequest, body: any, context?: any) {
  try {
    const { email, password } = body;

    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = generateJWT(user);

    return NextResponse.json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export const POST = withCors(validateRequest(loginSchema)(loginHandler));
