"use client";

import { useState, useRef, useEffect } from "react";
import Header from "./Header";
import MessagesArea from "./MessagesArea";
import InputArea from "./InputArea";

export default function VoiceAssistant() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  const FIRST_WEBHOOK =
    "https://chadyesilova.app.n8n.cloud/webhook/4b76e016-1d2a-406e-a3c0-91a4149c9649";
  const SECOND_WEBHOOK =
    "https://chadyesilova.app.n8n.cloud/webhook/7ee86804-d424-4a14-8b5b-42f8e763b229";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ----------------- RECORDING -----------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        // 1️⃣ Transcribe user audio via SECOND webhook
        await transcribeAudio(audioBlob, "user");

        // 2️⃣ Send user audio to FIRST webhook to get assistant voice
        await handleAssistantReply(audioBlob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  // ----------------- AUDIO PLAYBACK -----------------
  const playAudio = (audioUrl, messageId) => {
    if (!audioRef.current) return;
    if (playingAudioId === messageId) {
      audioRef.current.pause();
      setPlayingAudioId(null);
    } else {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setPlayingAudioId(messageId);
      audioRef.current.onended = () => setPlayingAudioId(null);
    }
  };

  const sendTextMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    const content = inputText;
    setInputText("");
    setIsLoading(true);

    try {
      // ⭐ Only FIRST webhook → returns text output
      const resp = await fetch(FIRST_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "text", text: content }),
      });

      const data = await resp.json();
      console.log(data)
      const replyText = Array.isArray(data)
        ? data[0]?.output
        : data.output || "No text found";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "assistant",
          content: replyText,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error("Error sending text message:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------- SEND TEXT -----------------
  // const sendTextMessage = async () => {
  //   if (!inputText.trim()) return;
  //   const userMessage = {
  //     id: Date.now().toString(),
  //     type: "user",
  //     content: inputText,
  //     timestamp: new Date(),
  //   };
  //   setMessages((prev) => [...prev, userMessage]);

  //   const content = inputText;
  //   setInputText("");
  //   setIsLoading(true);

  //   try {
  //     // 1️⃣ Send text to FIRST webhook → get assistant voice
  //     const resp = await fetch(FIRST_WEBHOOK, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ type: "text", text: content }),
  //     });

  //     // Receive AI voice reply
  //     const replyBlob = await resp.blob();
  //     const audioUrl = URL.createObjectURL(replyBlob);
  //     audioRef.current.src = audioUrl;
  //     audioRef.current.play();

  //     // 2️⃣ Send assistant voice to SECOND webhook → get transcript
  //     const replyBuffer = await replyBlob.arrayBuffer();
  //     const base64Reply = btoa(
  //       String.fromCharCode(...new Uint8Array(replyBuffer))
  //     );

  //     const secondResp = await fetch(SECOND_WEBHOOK, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ type: "audio", audio: base64Reply }),
  //     });

  //     const secondData = await secondResp.json();
  //     const transcript = Array.isArray(secondData)
  //       ? secondData[0]?.text
  //       : secondData.text || "No text found";

  //     setMessages((prev) => [
  //       ...prev,
  //       {
  //         id: Date.now().toString(),
  //         type: "assistant",
  //         content: transcript,
  //         timestamp: new Date(),
  //       },
  //     ]);
  //   } catch (err) {
  //     console.error("Error sending text message:", err);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // ----------------- AUDIO HANDLERS -----------------
  const transcribeAudio = async (audioBlob, sender = "user") => {
    try {
      const buffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(buffer)));

      const resp = await fetch(SECOND_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "audio", audio: base64Audio }),
      });

      const data = await resp.json();
      const transcript =
        Array.isArray(data) && data[0]?.text
          ? data[0].text
          : data.text || "No text found";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: sender === "user" ? "user" : "assistant",
          content: transcript,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error("Error transcribing audio:", err);
    }
  };

  const handleAssistantReply = async (audioBlob) => {
    try {
      // Send user audio to FIRST webhook → get AI voice
      const buffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(buffer)));

      const resp = await fetch(FIRST_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "audio", audio: base64Audio }),
      });

      const replyBlob = await resp.blob();
      const audioUrl = URL.createObjectURL(replyBlob);
      audioRef.current.src = audioUrl;
      audioRef.current.play();

      // Transcribe assistant voice via SECOND webhook
      const replyBuffer = await replyBlob.arrayBuffer();
      const base64Reply = btoa(
        String.fromCharCode(...new Uint8Array(replyBuffer))
      );

      const secondResp = await fetch(SECOND_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "audio", audio: base64Reply }),
      });

      const secondData = await secondResp.json();
      const transcript = Array.isArray(secondData)
        ? secondData[0]?.text
        : secondData.text || "No text found";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "assistant",
          content: transcript,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error("Error handling assistant reply:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "assistant",
          content: "Error processing assistant audio.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const clearChat = () => setMessages([]);

    return (
      <div className="flex flex-col h-screen w-full bg-gradient-to-b from-blue-100 via-blue-50 to-cyan-100">
        <div className="flex flex-col h-full max-w-4xl mx-auto p-4 w-full">
          <Header clearChat={clearChat} />
          <MessagesArea
            messages={messages}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
            playingAudioId={playingAudioId}
            playAudio={playAudio}
          />
          <InputArea
            inputText={inputText}
            setInputText={setInputText}
            sendTextMessage={sendTextMessage}
            startRecording={startRecording}
            stopRecording={stopRecording}
            isRecording={isRecording}
            recordingDuration={recordingDuration}
            isLoading={isLoading}
            formatDuration={formatDuration}
          />
          <audio ref={audioRef} className="hidden" />
        </div>
      </div>
  );
}

// "use client";

// import { useState, useRef, useEffect } from "react";
// import Header from "./Header";
// import MessagesArea from "./MessagesArea";
// import InputArea from "./InputArea";

// export default function VoiceAssistant() {
//   const [messages, setMessages] = useState([]);
//   const [inputText, setInputText] = useState("");
//   const [isRecording, setIsRecording] = useState(false);
//   const [recordingDuration, setRecordingDuration] = useState(0);
//   const [isLoading, setIsLoading] = useState(false);
//   const [playingAudioId, setPlayingAudioId] = useState(null);

//   const mediaRecorderRef = useRef(null);
//   const audioChunksRef = useRef([]);
//   const recordingIntervalRef = useRef(null);
//   const messagesEndRef = useRef(null);
//   const audioRef = useRef(null);

//   const FIRST_WEBHOOK =
//     "https://chadyesilova.app.n8n.cloud/webhook/4b76e016-1d2a-406e-a3c0-91a4149c9649";
//   const SECOND_WEBHOOK =
//     "https://chadyesilova.app.n8n.cloud/webhook/7ee86804-d424-4a14-8b5b-42f8e763b229";

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const formatDuration = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins}:${secs.toString().padStart(2, "0")}`;
//   };

//   // ----------------- RECORDING -----------------
//   const startRecording = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const mediaRecorder = new MediaRecorder(stream, {
//         mimeType: "audio/webm",
//       });
//       mediaRecorderRef.current = mediaRecorder;
//       audioChunksRef.current = [];

//       mediaRecorder.ondataavailable = (event) => {
//         if (event.data.size > 0) audioChunksRef.current.push(event.data);
//       };

//       mediaRecorder.onstop = async () => {
//         const audioBlob = new Blob(audioChunksRef.current, {
//           type: "audio/webm",
//         });

//         // 1️⃣ Transcribe user audio via SECOND webhook
//         await transcribeAudio(audioBlob, "user");

//         // 2️⃣ Send user audio to FIRST webhook to get assistant voice
//         await handleAssistantReply(audioBlob);

//         stream.getTracks().forEach((track) => track.stop());
//       };

//       mediaRecorder.start();
//       setIsRecording(true);
//       setRecordingDuration(0);

//       recordingIntervalRef.current = setInterval(() => {
//         setRecordingDuration((prev) => prev + 1);
//       }, 1000);
//     } catch (error) {
//       console.error("Error accessing microphone:", error);
//       alert("Could not access microphone. Please check permissions.");
//     }
//   };

//   const stopRecording = () => {
//     if (mediaRecorderRef.current && isRecording) {
//       mediaRecorderRef.current.stop();
//       setIsRecording(false);
//       clearInterval(recordingIntervalRef.current);
//     }
//   };

//   // ----------------- AUDIO PLAYBACK -----------------
//   const playAudio = (audioUrl, messageId) => {
//     if (!audioRef.current) return;
//     if (playingAudioId === messageId) {
//       audioRef.current.pause();
//       setPlayingAudioId(null);
//     } else {
//       audioRef.current.src = audioUrl;
//       audioRef.current.play();
//       setPlayingAudioId(messageId);
//       audioRef.current.onended = () => setPlayingAudioId(null);
//     }
//   };

//   // ----------------- SEND TEXT -----------------
//   const sendTextMessage = async () => {
//     if (!inputText.trim()) return;
//     const userMessage = {
//       id: Date.now().toString(),
//       type: "user",
//       content: inputText,
//       timestamp: new Date(),
//     };
//     setMessages((prev) => [...prev, userMessage]);

//     const content = inputText;
//     setInputText("");
//     setIsLoading(true);

//     try {
//       // 1️⃣ Send text to FIRST webhook → get assistant voice
//       const resp = await fetch(FIRST_WEBHOOK, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ type: "text", text: content }),
//       });

//       // Receive AI voice reply
//       const replyBlob = await resp.blob();
//       const audioUrl = URL.createObjectURL(replyBlob);
//       audioRef.current.src = audioUrl;
//       audioRef.current.play();

//       // 2️⃣ Send assistant voice to SECOND webhook → get transcript
//       const replyBuffer = await replyBlob.arrayBuffer();
//       const base64Reply = btoa(
//         String.fromCharCode(...new Uint8Array(replyBuffer))
//       );

//       const secondResp = await fetch(SECOND_WEBHOOK, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ type: "audio", audio: base64Reply }),
//       });

//       const secondData = await secondResp.json();
//       const transcript = Array.isArray(secondData)
//         ? secondData[0]?.text
//         : secondData.text || "No text found";

//       setMessages((prev) => [
//         ...prev,
//         {
//           id: Date.now().toString(),
//           type: "assistant",
//           content: transcript,
//           timestamp: new Date(),
//         },
//       ]);
//     } catch (err) {
//       console.error("Error sending text message:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // ----------------- AUDIO HANDLERS -----------------
//   const transcribeAudio = async (audioBlob, sender = "user") => {
//     try {
//       const buffer = await audioBlob.arrayBuffer();
//       const base64Audio = btoa(String.fromCharCode(...new Uint8Array(buffer)));

//       const resp = await fetch(SECOND_WEBHOOK, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ type: "audio", audio: base64Audio }),
//       });

//       const data = await resp.json();
//       const transcript =
//         Array.isArray(data) && data[0]?.text
//           ? data[0].text
//           : data.text || "No text found";

//       setMessages((prev) => [
//         ...prev,
//         {
//           id: Date.now().toString(),
//           type: sender === "user" ? "user" : "assistant",
//           content: transcript,
//           timestamp: new Date(),
//         },
//       ]);
//     } catch (err) {
//       console.error("Error transcribing audio:", err);
//     }
//   };

//   const handleAssistantReply = async (audioBlob) => {
//     try {
//       // Send user audio to FIRST webhook → get AI voice
//       const buffer = await audioBlob.arrayBuffer();
//       const base64Audio = btoa(String.fromCharCode(...new Uint8Array(buffer)));

//       const resp = await fetch(FIRST_WEBHOOK, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ type: "audio", audio: base64Audio }),
//       });

//       const replyBlob = await resp.blob();
//       const audioUrl = URL.createObjectURL(replyBlob);
//       audioRef.current.src = audioUrl;
//       audioRef.current.play();

//       // Transcribe assistant voice via SECOND webhook
//       const replyBuffer = await replyBlob.arrayBuffer();
//       const base64Reply = btoa(
//         String.fromCharCode(...new Uint8Array(replyBuffer))
//       );

//       const secondResp = await fetch(SECOND_WEBHOOK, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ type: "audio", audio: base64Reply }),
//       });

//       const secondData = await secondResp.json();
//       const transcript = Array.isArray(secondData)
//         ? secondData[0]?.text
//         : secondData.text || "No text found";

//       setMessages((prev) => [
//         ...prev,
//         {
//           id: Date.now().toString(),
//           type: "assistant",
//           content: transcript,
//           timestamp: new Date(),
//         },
//       ]);
//     } catch (err) {
//       console.error("Error handling assistant reply:", err);
//       setMessages((prev) => [
//         ...prev,
//         {
//           id: Date.now().toString(),
//           type: "assistant",
//           content: "Error processing assistant audio.",
//           timestamp: new Date(),
//         },
//       ]);
//     }
//   };

//   const clearChat = () => setMessages([]);

//   return (
//     <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
//       <Header clearChat={clearChat} />
//       <MessagesArea
//         messages={messages}
//         isLoading={isLoading}
//         messagesEndRef={messagesEndRef}
//         playingAudioId={playingAudioId}
//         playAudio={playAudio}
//       />
//       <InputArea
//         inputText={inputText}
//         setInputText={setInputText}
//         sendTextMessage={sendTextMessage}
//         startRecording={startRecording}
//         stopRecording={stopRecording}
//         isRecording={isRecording}
//         recordingDuration={recordingDuration}
//         isLoading={isLoading}
//         formatDuration={formatDuration}
//       />
//       <audio ref={audioRef} className="hidden" />
//     </div>
//   );
// }

// // "use client";

// // import { useState, useRef, useEffect } from "react";
// // import Header from "./Header";
// // import MessagesArea from "./MessagesArea";
// // import InputArea from "./InputArea";

// // export default function VoiceAssistant() {
// //   const [messages, setMessages] = useState([]);
// //   const [inputText, setInputText] = useState("");
// //   const [isRecording, setIsRecording] = useState(false);
// //   const [recordingDuration, setRecordingDuration] = useState(0);
// //   const [isLoading, setIsLoading] = useState(false);
// //   const [playingAudioId, setPlayingAudioId] = useState(null);

// //   const mediaRecorderRef = useRef(null);
// //   const audioChunksRef = useRef([]);
// //   const recordingIntervalRef = useRef(null);
// //   const messagesEndRef = useRef(null);
// //   const audioRef = useRef(null);

// //   const WEBHOOK_URL =
// //     "https://chadyesilova.app.n8n.cloud/webhook/4b76e016-1d2a-406e-a3c0-91a4149c9649";

// //   useEffect(() => {
// //     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
// //   }, [messages]);

// //   const formatDuration = (seconds) =>
// //     `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

// //   // ----------------- RECORDING -----------------
// //   const startRecording = async () => {
// //     try {
// //       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
// //       const mediaRecorder = new MediaRecorder(stream, {
// //         mimeType: "audio/webm",
// //       });
// //       mediaRecorderRef.current = mediaRecorder;
// //       audioChunksRef.current = [];

// //       mediaRecorder.ondataavailable = (event) => {
// //         if (event.data.size > 0) audioChunksRef.current.push(event.data);
// //       };

// //       mediaRecorder.onstop = async () => {
// //         const audioBlob = new Blob(audioChunksRef.current, {
// //           type: "audio/webm",
// //         });
// //         await sendAudioMessage(audioBlob);
// //         stream.getTracks().forEach((track) => track.stop());
// //       };

// //       mediaRecorder.start();
// //       setIsRecording(true);
// //       setRecordingDuration(0);

// //       recordingIntervalRef.current = setInterval(() => {
// //         setRecordingDuration((prev) => prev + 1);
// //       }, 1000);
// //     } catch (error) {
// //       console.error("Error accessing microphone:", error);
// //       alert("Could not access microphone. Please check permissions.");
// //     }
// //   };

// //   const stopRecording = () => {
// //     if (mediaRecorderRef.current && isRecording) {
// //       mediaRecorderRef.current.stop();
// //       setIsRecording(false);
// //       clearInterval(recordingIntervalRef.current);
// //     }
// //   };

// //   // ----------------- AUDIO PLAYBACK -----------------
// //   const playAudio = (audioUrl, messageId) => {
// //     if (!audioRef.current) return;
// //     if (playingAudioId === messageId) {
// //       audioRef.current.pause();
// //       setPlayingAudioId(null);
// //     } else {
// //       audioRef.current.src = audioUrl;
// //       audioRef.current.play();
// //       setPlayingAudioId(messageId);
// //       audioRef.current.onended = () => setPlayingAudioId(null);
// //     }
// //   };

// //   // ----------------- SEND TEXT -----------------
// //   const sendTextMessage = async () =>
// //     sendMessage({ type: "text", content: inputText, clearInput: true });

// //   const sendMessage = async ({ type, content, clearInput }) => {
// //     if (type === "text") {
// //       const userMessage = {
// //         id: Date.now().toString(),
// //         type: "user",
// //         content,
// //         timestamp: new Date(),
// //       };
// //       setMessages((prev) => [...prev, userMessage]);
// //       if (clearInput) setInputText("");

// //       try {
// //         setIsLoading(true);
// //         const resp = await fetch(WEBHOOK_URL, {
// //           method: "POST",
// //           headers: { "Content-Type": "application/json" },
// //           body: JSON.stringify({ type: "text", text: content }),
// //         });
// //         const data = await resp.json();
// //         console.log("Webhook response:", data);

// //         // Extract response text from [{ output: "..." }]
// //         const replyText = Array.isArray(data) ? data[0]?.output : data.output;
// //         if (replyText) {
// //           setMessages((prev) => [
// //             ...prev,
// //             {
// //               id: Date.now().toString(),
// //               type: "assistant",
// //               content: replyText,
// //               timestamp: new Date(),
// //             },
// //           ]);
// //         }
// //       } catch (err) {
// //         console.error("Error sending text message:", err);
// //       } finally {
// //         setIsLoading(false);
// //       }
// //     }
// //   };

// //   const sendAudioMessage = async (audioBlob) => {
// //     setIsLoading(true);
// //     try {
// //       // 1️⃣ Convert recorded blob to base64
// //       const buffer = await audioBlob.arrayBuffer();
// //       const base64Audio = btoa(String.fromCharCode(...new Uint8Array(buffer)));

// //       // 2️⃣ Send recorded audio to first webhook (voice reply)
// //       const FIRST_WEBHOOK =
// //         "https://chadyesilova.app.n8n.cloud/webhook/4b76e016-1d2a-406e-a3c0-91a4149c9649";
// //       const resp = await fetch(FIRST_WEBHOOK, {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({ type: "audio", audio: base64Audio }),
// //       });

// //       // 3️⃣ Receive AI voice reply as binary
// //       const replyBlob = await resp.blob();
// //       const audioUrl = URL.createObjectURL(replyBlob);

// //       // 4️⃣ Play AI voice reply
// //       audioRef.current.src = audioUrl;
// //       audioRef.current.play();

// //       // 5️⃣ Send the AI voice reply to second webhook
// //       const SECOND_WEBHOOK =
// //         "https://chadyesilova.app.n8n.cloud/webhook/7ee86804-d424-4a14-8b5b-42f8e763b229";
// //       const replyBuffer = await replyBlob.arrayBuffer();
// //       const base64Reply = btoa(
// //         String.fromCharCode(...new Uint8Array(replyBuffer))
// //       );

// //       const secondResp = await fetch(SECOND_WEBHOOK, {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({ type: "audio", audio: base64Reply }),
// //       });

// //       // 6️⃣ Get transcription text from second webhook
// //       const secondData = await secondResp.json();
// //       const transcript = Array.isArray(secondData)
// //         ? secondData[0]?.text
// //         : secondData.text || "No text found";

// //       // 7️⃣ Append transcript to chat
// //       setMessages((prev) => [
// //         ...prev,
// //         {
// //           id: Date.now().toString(),
// //           type: "assistant",
// //           content: transcript,
// //           timestamp: new Date(),
// //         },
// //       ]);

// //       console.log("✅ Voice flow complete:", transcript);
// //     } catch (err) {
// //       console.error("Error processing audio message:", err);
// //       setMessages((prev) => [
// //         ...prev,
// //         {
// //           id: Date.now().toString(),
// //           type: "assistant",
// //           content: "Error processing audio message.",
// //           timestamp: new Date(),
// //         },
// //       ]);
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   };

// //   const clearChat = () => setMessages([]);

// //   return (
// //     <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
// //       <Header clearChat={clearChat} />
// //       <MessagesArea
// //         messages={messages}
// //         isLoading={isLoading}
// //         messagesEndRef={messagesEndRef}
// //         playingAudioId={playingAudioId}
// //         playAudio={playAudio}
// //       />
// //       <InputArea
// //         inputText={inputText}
// //         setInputText={setInputText}
// //         sendTextMessage={sendTextMessage}
// //         startRecording={startRecording}
// //         stopRecording={stopRecording}
// //         isRecording={isRecording}
// //         recordingDuration={recordingDuration}
// //         isLoading={isLoading}
// //         formatDuration={formatDuration}
// //       />
// //       <audio ref={audioRef} className="hidden" />
// //     </div>
// //   );
// // }
