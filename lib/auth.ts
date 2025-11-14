import NextAuth from "next-auth"
import prisma from "./prisma"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

// Validate required environment variables
function validateEnvVars() {
  const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (!authSecret) {
    console.error("❌ CRITICAL: AUTH_SECRET or NEXTAUTH_SECRET is not set!");
    console.error("For NextAuth v5, you need to set AUTH_SECRET in your environment variables.");
    console.error("Generate one with: openssl rand -base64 32");
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET environment variable is required");
  }

  if (!process.env.DATABASE_URL) {
    console.error("❌ CRITICAL: DATABASE_URL is not set!");
    throw new Error("DATABASE_URL environment variable is required");
  }

  console.log("✅ Environment variables validated successfully");
  console.log("Using AUTH_SECRET:", authSecret.substring(0, 10) + "...");
  console.log("DATABASE_URL configured:", process.env.DATABASE_URL ? "Yes" : "No");
}

// Validate on module load
try {
  validateEnvVars();
} catch (error) {
  console.error("Environment validation failed:", error);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("🔐 Authorization attempt for:", credentials?.email);
        
        // Check if credentials exist
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null;
        }

        try {
          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string }
          });

          console.log("👤 User found:", user ? "Yes" : "No");

          if (!user) {
            console.log("❌ User not found in database");
            return null;
          }
          
          // Check if user has a password (not a social login user)
          if (!user.password) {
            console.log("❌ User has no password (social login user?)");
            return null;
          }

          // Verify password
          const valid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          console.log("🔑 Password valid:", valid);

          if (!valid) {
            console.log("❌ Invalid password");
            return null;
          }

          console.log("✅ Authentication successful for:", user.email);
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("❌ Error during authorization:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("🔄 signIn callback - Provider:", account?.provider);
      
      // For social logins, create user if doesn't exist
      if (account?.provider !== "credentials") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });

          if (!existingUser) {
            console.log("📝 Creating new social login user:", user.email);
            
            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || "",
                image: user.image || "",
                status: "active", // Social login users are active by default
              }
            });
            
            console.log("✅ New user created:", user.email);
          } else {
            console.log("👤 Existing social user found:", user.email);
            
            // Update user status to active if pending
            if (existingUser.status === "pending") {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { status: "active" }
              });
              console.log("✅ User status updated to active");
            }
          }
        } catch (error) {
          console.error("❌ Error in social login callback:", error);
          return false;
        }
      }
      
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        console.log("🎫 JWT token created for user:", user.email);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        console.log("📋 Session created for user:", session.user.email);
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth',
  },
  debug: process.env.NODE_ENV === 'development', // Enable debug mode in development
})