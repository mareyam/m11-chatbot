// app/api/auth/signup/route.js
import clientPromise from "@/app/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response("Email and password are required", { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("ai_agent");

    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser)
      return new Response("User already exists", { status: 400 });

    const passwordHash = bcrypt.hashSync(password, 10);

    const result = await db.collection("users").insertOne({
      email,
      passwordHash,
      prompts: [],
      messages: [], // to store { text, role, sentAt }
      createdAt: new Date(),
    });

    return new Response(JSON.stringify({ id: result.insertedId, email }), {
      status: 201,
    });
  } catch (err) {
    console.error(err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
