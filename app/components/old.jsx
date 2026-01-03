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

//   const WEBHOOK_URL =
//     "https://chadyesilova.app.n8n.cloud/webhook/4b76e016-1d2a-406e-a3c0-91a4149c9649";

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const formatDuration = (seconds) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins}:${secs.toString().padStart(2, "0")}`;
//   };

//   const startRecording = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const mediaRecorder = new MediaRecorder(stream);
//       mediaRecorderRef.current = mediaRecorder;
//       audioChunksRef.current = [];

//       mediaRecorder.ondataavailable = (event) =>
//         audioChunksRef.current.push(event.data);

//       mediaRecorder.onstop = async () => {
//         const audioBlob = new Blob(audioChunksRef.current, {
//           type: "audio/webm",
//         });
//         await sendAudioMessage(audioBlob);
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

//   const sendTextMessage = async () =>
//     sendMessage({ type: "text", content: inputText, clearInput: true });
//   const sendAudioMessage = async (audioBlob) => {
//     setIsLoading(true);

//     try {
//       const formData = new FormData();
//       formData.append("file", audioBlob, "input.webm");

//       const uploadResp = await fetch(
//         "https://api.elevenlabs.io/v1/speech-to-text/transcriptions",
//         {
//           method: "POST",
//           headers: {
//             "xi-api-key": "sk_27f957f7d5b8d2f76b35db75df38b1a49014dd90edb96518",
//           },
//           body: formData,
//         }
//       );
//       const uploadData = await uploadResp.json();
//       const transcriptionId = uploadData.transcription_id;

//       // 2️⃣ Retrieve the transcript by ID
//       const transcriptResp = await fetch(
//         `https://api.elevenlabs.io/v1/speech-to-text/transcripts/${transcriptionId}`,
//         {
//           headers: {
//             "xi-api-key": "sk_27f957f7d5b8d2f76b35db75df38b1a49014dd90edb96518",
//           },
//         }
//       );
//       const transcriptData = await transcriptResp.json();
//       const transcript =
//         transcriptData.text || transcriptData.transcripts?.[0]?.text;

//       // 3️⃣ Convert audio to Base64
//       const reader = new FileReader();
//       const base64Audio = await new Promise((resolve) => {
//         reader.readAsDataURL(audioBlob);
//         reader.onloadend = () => resolve(reader.result.split(",")[1]);
//       });

//       // 4️⃣ Send both transcript and audio to your webhook
//       const response = await fetch(WEBHOOK_URL, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ type: "voice", audio: base64Audio, transcript }),
//       });

//       const webhookData = await response.json();
//       console.log("Webhook response:", webhookData);

//       setMessages((prev) => [
//         ...prev,
//         {
//           id: Date.now().toString(),
//           type: "user",
//           content: transcript,
//           timestamp: new Date(),
//         },
//       ]);
//     } catch (err) {
//       console.error("Error sending audio message:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const sendMessage = async ({ type, content, audioBlob, clearInput }) => {
//     const userMessage = {
//       id: Date.now().toString(),
//       type: "user",
//       content: type === "text" ? content : "🎤 Voice message",
//       audioUrl: type === "voice" ? URL.createObjectURL(audioBlob) : null,
//       timestamp: new Date(),
//     };
//     setMessages((prev) => [...prev, userMessage]);
//     if (clearInput) setInputText("");
//     setIsLoading(true);

//     try {
//       let body;
//       if (type === "text") body = { type: "text", content };
//       else if (type === "voice") {
//         const reader = new FileReader();
//         await new Promise((resolve) => {
//           reader.readAsDataURL(audioBlob);
//           reader.onloadend = resolve;
//         });
//         body = { type: "voice", audio: reader.result.split(",")[1] };
//       }

//       const response = await fetch(WEBHOOK_URL, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(body),
//       });

//       console.log("response is", response);

//       const contentType = response.headers.get("content-type");
//       let assistantMessage;

//       if (contentType?.includes("audio")) {
//         const blob = await response.blob();
//         const audioUrl = URL.createObjectURL(blob);

//         assistantMessage = {
//           id: (Date.now() + 1).toString(),
//           type: "assistant",
//           content: "🎧 Voice reply",
//           audioUrl,
//           timestamp: new Date(),
//         };

//         if (audioRef.current) {
//           audioRef.current.src = audioUrl;
//           audioRef.current.play();
//         }
//       } else {
//         const data = await response.json();
//         console.log("data", data);
//         const outputText = Array.isArray(data) ? data[0]?.output : data.output;

//         assistantMessage = {
//           id: (Date.now() + 1).toString(),
//           type: "assistant",
//           content: outputText || "Assistant replied",
//           audioUrl: data.audioUrl || null,
//           timestamp: new Date(),
//         };

//         if (data.audioUrl && audioRef.current) {
//           audioRef.current.src = data.audioUrl;
//           audioRef.current.play();
//         }
//       }

//       console.log("assistantMessage is", assistantMessage);
//       setMessages((prev) => [...prev, assistantMessage]);
//     } catch (error) {
//       console.error("Error sending message:", error);
//       setMessages((prev) => [
//         ...prev,
//         {
//           id: (Date.now() + 1).toString(),
//           type: "assistant",
//           content: "Sorry, there was an error processing your message.",
//           timestamp: new Date(),
//         },
//       ]);
//     } finally {
//       setIsLoading(false);
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

// // if (contentType?.includes("audio")) {
// //   const blob = await response.blob();
// //   const audioUrl = URL.createObjectURL(blob);
// //   assistantMessage = {
// //     id: (Date.now() + 1).toString(),
// //     type: "assistant",
// //     content: "🎧 Voice reply",
// //     audioUrl,
// //     timestamp: new Date(),
// //   };
// //   audioRef.current.src = audioUrl;
// //   audioRef.current.play();
// // } else {
// //   const data = await response.json();
// //   console.log(data);
// //   console.log(data[0]);
// //   console.log(data[0].output);

// //   const assistantMessage = {
// //     id: (Date.now() + 1).toString(),
// //     type: "assistant",
// //     content: data[0].output || "Assistant replied",
// //     audioUrl: data[0]?.audioUrl || null,
// //     timestamp: new Date(),
// //   };
// //   setMessages((prev) => [...prev, assistantMessage]);

// //   if (data[0]?.audioUrl) {
// //     audioRef.current.src = data[0].audioUrl;
// //     audioRef.current.play();
// //   }
// // }
