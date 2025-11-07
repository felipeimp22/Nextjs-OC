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
    const existing = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existing) {
      return { success: false, error: "Email already exists" };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        status: "pending", // New users start as pending
      }
    });

    // Auto sign in after signup
    await nextAuthSignIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

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
    console.error("Sign up error:", error);
    return { success: false, error: "Failed to sign up" };
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