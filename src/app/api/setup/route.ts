import { NextResponse } from "next/server";
import { initializeDefaultUser } from "@/lib/auth";

export async function POST() {
  try {
    await initializeDefaultUser();

    return NextResponse.json({
      success: true,
      message: "Default user initialized successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
