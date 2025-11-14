'use server';

import prisma from "@/lib/prisma";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";

export async function signUp(data: {
  email: string;
  password: string;
  name: string;
}) {
  try {
    console.log("🚀 Starting signup process for:", data.email);

    // Check for existing user
    const existing = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existing) {
      console.log("❌ Email already exists:", data.email);
      return { success: false, error: "Email already exists" };
    }

    console.log("✅ Email is available, hashing password...");
    const hashedPassword = await bcrypt.hash(data.password, 10);

    console.log("📝 Creating user in database...");
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        status: "pending", // New users start as pending
      }
    });

    console.log("✅ User created successfully:", user.id);

    // Auto sign in after signup
    console.log("🔐 Auto-signing in user...");
    const signInResult = await nextAuthSignIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    console.log("✅ Sign in result:", signInResult);

    revalidatePath("/");
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status
      }
    };
  } catch (error: Error | unknown) {
    console.error("❌ Sign up error details:", error);
    console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");

    // Return more specific error message if available
    const errorMessage = error instanceof Error ? error.message : "Failed to sign up";
    return { success: false, error: errorMessage };
  }
}

export async function signIn(data: {
  email: string;
  password: string;
}) {
  try {
    await nextAuthSignIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Invalid credentials" };
    }
    return { success: false, error: "Failed to sign in" };
  }
}

export async function signOut() {
  await nextAuthSignOut({ redirect: false });
  revalidatePath("/");
  return { success: true };
}

export async function getCurrentUser() {
  try {
    const { auth: getSession } = await import("@/lib/auth");
    const session = await getSession();

    if (!session?.user) {
      return { success: false, user: null };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        status: true,
        createdAt: true,
        restaurants: {
          include: {
            restaurant: true
          }
        }
      }
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, user: null };
  }
}