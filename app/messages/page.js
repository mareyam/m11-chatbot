"use client";
import { useState, useEffect } from "react";

export default function Messages() {
  const [email, setEmail] = useState("m@gmail.com");
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState(null);

  const WEBHOOK_URL =
    "https://chadyesilova.app.n8n.cloud/webhook/f98ca063-0a4a-4dd2-bf8f-efe75daca9a1";

  // Fetch all users from MongoDB
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/users"); // should return all users
      if (!resp.ok) throw new Error("Failed to fetch users");
      const data = await resp.json();
      setUsers(data); // data = array of user documents
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter messages for current email
  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const user = users.find((u) => u.email === email);
    const userMessages = user?.messages || [];
    setMessages(userMessages);

    if (userMessages.length > 0) {
      sendMessagesToWebhook(userMessages);
    }
  }, [users, email]);

  // Send only content array to webhook
  const sendMessagesToWebhook = async (msgs) => {
    try {
      const contentArray = msgs.map((m) => m.content);
      const resp = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: contentArray }),
      });

      const data = await resp.json();
      setWebhookResponse(data); // display the webhook response
      console.log("Webhook response:", data);
    } catch (err) {
      console.error("Failed to send messages to webhook:", err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-blue-100 via-blue-50 to-cyan-100 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Messages for {email}
      </h1>

      <div className="mb-4">
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
          className="p-2 rounded-lg border border-gray-300 w-full max-w-xs"
        />
      </div>

      {loading ? (
        <p>Loading users...</p>
      ) : messages.length === 0 ? (
        <p>No messages found for this email.</p>
      ) : (
        <div className="space-y-4 mb-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl ${
                msg.sender === "assistant"
                  ? "bg-blue-200 text-gray-800"
                  : "bg-gray-200 text-gray-900"
              }`}
            >
              <p className="text-sm font-semibold">
                {msg.sender.toUpperCase()}
              </p>
              <p>{msg.content}</p>
              <p className="text-xs text-gray-500">
                {new Date(msg.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {webhookResponse && (
        <div className="bg-white p-4 rounded-xl shadow-md mt-4">
          <h2 className="text-xl font-bold mb-2">Webhook Response</h2>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(webhookResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// "use client";
// import { useState, useEffect } from "react";

// export default function Messages() {
//   const [email, setEmail] = useState("m@gmail.com");
//   const [users, setUsers] = useState([]);
//   const [messages, setMessages] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const WEBHOOK_URL =
//     "https://chadyesilova.app.n8n.cloud/webhook/f98ca063-0a4a-4dd2-bf8f-efe75daca9a1";

//   // Fetch all users from MongoDB
//   const fetchUsers = async () => {
//     setLoading(true);
//     try {
//       const resp = await fetch("/api/users"); // should return all users
//       if (!resp.ok) throw new Error("Failed to fetch users");
//       const data = await resp.json();
//       setUsers(data); // data = array of user documents
//     } catch (err) {
//       console.error(err);
//       setUsers([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Filter messages for current email
//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   useEffect(() => {
//     const user = users.find((u) => u.email === email);
//     const userMessages = user?.messages || [];
//     setMessages(userMessages);

//     if (userMessages.length > 0) {
//       sendMessagesToWebhook(userMessages);
//     }
//   }, [users, email]);

//   // Send messages to n8n webhook
//   const sendMessagesToWebhook = async (msgs) => {
//     try {
//       await fetch(WEBHOOK_URL, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ messages: msgs }),
//       });
//       console.log("Messages sent to webhook:", msgs);
//     } catch (err) {
//       console.error("Failed to send messages to webhook:", err);
//     }
//   };

//   return (
//     <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-blue-100 via-blue-50 to-cyan-100 p-8">
//       <h1 className="text-3xl font-bold text-gray-800 mb-4">
//         Messages for {email}
//       </h1>

//       <div className="mb-4">
//         <input
//           type="text"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           placeholder="Enter email"
//           className="p-2 rounded-lg border border-gray-300 w-full max-w-xs"
//         />
//       </div>

//       {loading ? (
//         <p>Loading users...</p>
//       ) : messages.length === 0 ? (
//         <p>No messages found for this email.</p>
//       ) : (
//         <div className="space-y-4">
//           {messages.map((msg, idx) => (
//             <div
//               key={idx}
//               className={`p-3 rounded-xl ${
//                 msg.sender === "assistant"
//                   ? "bg-blue-200 text-gray-800"
//                   : "bg-gray-200 text-gray-900"
//               }`}
//             >
//               <p className="text-sm font-semibold">
//                 {msg.sender.toUpperCase()}
//               </p>
//               <p>{msg.content}</p>
//               <p className="text-xs text-gray-500">
//                 {new Date(msg.timestamp).toLocaleString()}
//               </p>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
