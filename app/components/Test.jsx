"use client";
import { useRef, useState } from "react";

export default function SpeechWebhook() {
  const [active, setActive] = useState("");
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  async function start() {
    console.log("▶️ Start pressed");
    setActive("start");

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
    chunksRef.current = [];

    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    rec.onstop = async () => {
      console.log("⏹️ Recording stopped");
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const buffer = await blob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(buffer)));

      const body = JSON.stringify({ audio: base64Audio });

      console.log("🌐 Sending base64 audio JSON to webhook…");
      try {
        const res = await fetch(
          "https://chadyesilova.app.n8n.cloud/webhook/7ee86804-d424-4a14-8b5b-42f8e763b229",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          }
        );
        const text = await res.text();
        console.log("📝 Webhook response:", text);
      } catch (err) {
        console.error("❌ Webhook error:", err);
      }

      setActive("");
    };

    recorderRef.current = rec;
    rec.start();
    console.log("🎙️ Recording started…");
  }

  function stop() {
    console.log("🛑 Stop pressed");
    recorderRef.current && recorderRef.current.stop();
  }

  const btn = (k) =>
    `px-4 py-2 m-2 border rounded ${
      active === k ? "bg-blue-500 text-white" : ""
    }`;

  return (
    <div>
      <button
        className={btn("start")}
        onClick={start}
        disabled={active === "start"}
      >
        Start
      </button>
      <button className={btn("stop")} onClick={stop} disabled={!active}>
        Stop
      </button>
    </div>
  );
}
