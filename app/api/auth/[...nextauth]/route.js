import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/app/lib/mongodb";
import bcrypt from "bcryptjs";

// Auth options
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const client = await clientPromise;
        const db = client.db("ai_agent"); // your DB name
        const user = await db
          .collection("users")
          .findOne({ email: credentials.email });
        if (!user) return null;
        const isValid = bcrypt.compareSync(
          credentials.password,
          user.passwordHash
        );
        if (!isValid) return null;
        return { id: user._id.toString(), email: user.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

// Correct App Router export
export { handler as GET, handler as POST };
