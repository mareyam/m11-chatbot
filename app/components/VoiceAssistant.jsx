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
  const [finalDuration, setFinalDuration] = useState(0);

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

  // ---------- HELPER: safe Base64 for large Blobs ----------
  const blobToBase64 = async (blob) => {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000; // 32 KB chunks
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    // console.log(btoa(binary));
    return btoa(binary);
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

        // 1️⃣ Transcribe user audio
        await transcribeAudio(audioBlob, "user");

        // 2️⃣ Send to FIRST webhook for assistant voice
        await handleAssistantReply(audioBlob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      setFinalDuration(0);
      console.log("finalDuration when 0", finalDuration);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
        setFinalDuration((prev) => {
          const newVal = prev + 1;
          console.log("finalDuration is ", newVal);
          return newVal;
        });
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
      console.log("stop recording");
    }
  };

  // ----------------- AUDIO PLAYBACK -----------------
  const playAudio = (audioUrl, messageId) => {
    console.log("play audio");

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
    console.log("text");

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
      const resp = await fetch(FIRST_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "text", text: content }),
      });

      const data = await resp.json();
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

  const transcribeAudio = async (audioBlob, sender = "user") => {
    console.log("transcribeAudio");

    // Add placeholder
    const placeholderId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: placeholderId,
        type: sender,
        content: "Processing audio...",
        timestamp: new Date(),
      },
    ]);

    try {
      const base64Audio = await blobToBase64(audioBlob);

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

      // Replace placeholder with actual text
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === placeholderId ? { ...msg, content: transcript } : msg
        )
      );
    } catch (err) {
      console.error("Error transcribing audio:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === placeholderId
            ? { ...msg, content: "Error processing audio." }
            : msg
        )
      );
    }
  };

  const handleAssistantReply = async (audioBlob) => {
    console.log("handleAssistantReply");

    // Add placeholder
    const placeholderId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: placeholderId,
        type: "assistant",
        content: "Processing audio...",
        timestamp: new Date(),
      },
    ]);

    try {
      const base64Audio = await blobToBase64(audioBlob);

      const resp = await fetch(FIRST_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "audio", audio: base64Audio }),
      });

      const replyBlob = await resp.blob();
      const audioUrl = URL.createObjectURL(replyBlob);
      audioRef.current.src = audioUrl;
      audioRef.current.play();

      const base64Reply = await blobToBase64(replyBlob);

      const secondResp = await fetch(SECOND_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "audio", audio: base64Reply }),
      });

      const secondData = await secondResp.json();
      const transcript = Array.isArray(secondData)
        ? secondData[0]?.text
        : secondData.text || "No text found";

      // Replace placeholder with actual transcript
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === placeholderId ? { ...msg, content: transcript } : msg
        )
      );
    } catch (err) {
      console.error("Error handling assistant reply:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === placeholderId
            ? { ...msg, content: "Error processing audio." }
            : msg
        )
      );
    }
  };

  // const transcribeAudio = async (audioBlob, sender = "user") => {
  //   console.log("transcribeAudio");

  //   try {
  //     const base64Audio = await blobToBase64(audioBlob);

  //     const resp = await fetch(SECOND_WEBHOOK, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ type: "audio", audio: base64Audio }),
  //     });

  //     const data = await resp.json();
  //     const transcript =
  //       Array.isArray(data) && data[0]?.text
  //         ? data[0].text
  //         : data.text || "No text found";

  //     setMessages((prev) => [
  //       ...prev,
  //       {
  //         id: Date.now().toString(),
  //         type: sender === "user" ? "user" : "assistant",
  //         content: transcript,
  //         timestamp: new Date(),
  //       },
  //     ]);
  //   } catch (err) {
  //     console.error("Error transcribing audio:", err);
  //   }
  // };

  // const handleAssistantReply = async (audioBlob) => {
  //   console.log("handleAssistantReply");

  //   try {
  //     const base64Audio = await blobToBase64(audioBlob);

  //     const resp = await fetch(FIRST_WEBHOOK, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ type: "audio", audio: base64Audio }),
  //     });

  //     const replyBlob = await resp.blob();
  //     const audioUrl = URL.createObjectURL(replyBlob);
  //     audioRef.current.src = audioUrl;
  //     audioRef.current.play();

  //     const base64Reply = await blobToBase64(replyBlob);

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
  //     console.error("Error handling assistant reply:", err);
  //     setMessages((prev) => [
  //       ...prev,
  //       {
  //         id: Date.now().toString(),
  //         type: "assistant",
  //         content: "Error processing assistant audio.",
  //         timestamp: new Date(),
  //       },
  //     ]);
  //   }
  // };

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
          formatDuration={formatDuration}
          finalDuration={finalDuration}
        />
        <InputArea
          inputText={inputText}
          setInputText={setInputText}
          sendTextMessage={sendTextMessage}
          startRecording={startRecording}
          stopRecording={stopRecording}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          finalDuration={finalDuration}
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
//   const [finalDuration, setFinalDuration] = useState();

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
//       setFinalDuration(0);

//       recordingIntervalRef.current = setInterval(() => {
//         setRecordingDuration((prev) => prev + 1);
//         setFinalDuration((prev) => prev + 1);
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
//       // ⭐ Only FIRST webhook → returns text output
//       const resp = await fetch(FIRST_WEBHOOK, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ type: "text", text: content }),
//       });

//       const data = await resp.json();
//       console.log(data);
//       const replyText = Array.isArray(data)
//         ? data[0]?.output
//         : data.output || "No text found";

//       setMessages((prev) => [
//         ...prev,
//         {
//           id: Date.now().toString(),
//           type: "assistant",
//           content: replyText,
//           timestamp: new Date(),
//         },
//       ]);
//     } catch (err) {
//       console.error("Error sending text message:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

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
//     <div className="flex flex-col h-screen w-full bg-gradient-to-b from-blue-100 via-blue-50 to-cyan-100">
//       <div className="flex flex-col h-full max-w-4xl mx-auto p-4 w-full">
//         <Header clearChat={clearChat} />
//         <MessagesArea
//           messages={messages}
//           isLoading={isLoading}
//           messagesEndRef={messagesEndRef}
//           playingAudioId={playingAudioId}
//           recordingDuration={recordingDuration}
//           playAudio={playAudio}
//           formatDuration={formatDuration}
//         />
//         <InputArea
//           inputText={inputText}
//           setInputText={setInputText}
//           sendTextMessage={sendTextMessage}
//           startRecording={startRecording}
//           stopRecording={stopRecording}
//           isRecording={isRecording}
//           recordingDuration={recordingDuration}
//           finalDuration={finalDuration}
//           isLoading={isLoading}
//           formatDuration={formatDuration}
//         />
//         <audio ref={audioRef} className="hidden" />
//       </div>
//     </div>
//   );
// }
