import VoiceAssistant from "./components/VoiceAssistant";
import SpeechPage from "./components/Test";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <VoiceAssistant />
      {/* <SpeechPage /> */}
    </main>
  );
}
