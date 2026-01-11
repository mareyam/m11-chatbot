import clientPromise from "@/app/lib/mongodb";

export async function POST(req) {
  try {
    const { email, content, sender } = await req.json();
    if (!email || !content || !sender) {
      return new Response("Missing fields", { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("ai_agent");

    // Push into messages array
    const result = await db
      .collection("users")
      .updateOne(
        { email },
        { $push: { messages: { content, sender, timestamp: new Date() } } }
      );

    if (result.matchedCount === 0) {
      return new Response("User not found", { status: 404 });
    }

    return new Response(
      JSON.stringify({ content, sender, timestamp: new Date() }),
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// import clientPromise from "@/app/lib/mongodb";

// export async function POST(req) {
//   try {
//     const { email, content, sender } = await req.json();
//     if (!email || !content || !sender) {
//       return new Response("Missing fields", { status: 400 });
//     }

//     const client = await clientPromise;
//     const db = client.db("ai_agent");

//     // Ensure the field exists, or create it
//     const result = await db.collection("users").updateOne(
//       { email },
//       {
//         $push: { messages: { content, sender, timestamp: new Date() } },
//         $setOnInsert: { messages: [] }, // in case the user doc has no messages
//       }
//     );
//     console.log("result", result);

//     if (result.matchedCount === 0) {
//       return new Response("User not found", { status: 404 });
//     }

//     return new Response(
//       JSON.stringify({ content, sender, timestamp: new Date() }),
//       {
//         status: 201,
//       }
//     );
//   } catch (err) {
//     console.error(err);
//     return new Response("Internal Server Error", { status: 500 });
//   }
// }

// // // app/api/messages/route.js
// // import clientPromise from "@/app/lib/mongodb";

// // export async function POST(req) {
// //   try {
// //     const { email, content, sender } = await req.json();
// //     console.log("in messages", email);
// //     if (!email || !content || !sender) {
// //       return new Response("Missing fields", { status: 400 });
// //     }

// //     const client = await clientPromise;
// //     const db = client.db("ai_agent");

// //     const message = {
// //       content,
// //       sender,
// //       timestamp: new Date(),
// //     };

// //     console.log("message", message);

// //     const result = await db
// //       .collection("users")
// //       .updateOne({ email }, { $push: { messages: message } });

// //     console.log("result", result);

// //     if (result.matchedCount === 0) {
// //       return new Response("User not found", { status: 404 });
// //     }

// //     return new Response(JSON.stringify(message), { status: 201 });
// //   } catch (err) {
// //     console.error(err);
// //     return new Response("Internal Server Error", { status: 500 });
// //   }
// // }
