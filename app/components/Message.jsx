import AudioWaveform from "./AudioWaveform";

const Message = ({ message, playingAudioId, playAudio }) => {
  const messageType = message?.type || "assistant";

  return (
    <div
      className={`flex gap-3 ${
        messageType === "user" ? "justify-end" : "justify-start"
      }`}
    >
      {/* Avatar for assistant (left side) */}
      {messageType === "assistant" && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-800 via-pink-200 to-orange-100 shadow-lg"></div>
      )}

      <div
        className={`max-w-xs md:max-w-md px-4 py-3 rounded-lg ${
          messageType === "user"
            ? "bg-gray-300 text-gray-600"
            : "bg-black text-white"
        }`}
      >
        {message?.audioUrl ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => playAudio(message?.audioUrl, message?.id)}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
              >
                {playingAudioId === message?.id ? (
                  <span className="text-xl">⏸</span>
                ) : (
                  <span className="text-xl">▶</span>
                )}
              </button>
              <div className="flex-1">
                <AudioWaveform
                  isPlaying={playingAudioId === message?.id}
                  messageId={message?.id}
                  playingAudioId={playingAudioId}
                />
              </div>
            </div>
            {message?.content !== "🎤 Voice message" && (
              <p className="text-sm mt-2">{message?.content}</p>
            )}
          </div>
        ) : (
          <p>{message?.content}</p>
        )}
      </div>

      {/* Avatar for user (right side) */}
      {messageType === "user" && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-lg flex items-center justify-center text-white font-semibold">
          U
        </div>
      )}
    </div>
  );
};

export default Message;
// import AudioWaveform from "./AudioWaveform";

// const Message = ({ message, playingAudioId, playAudio }) => {
//   const messageType = message?.type || "assistant";
//   console.log(message);

//   return (
//     <div
//       className={`flex ${
//         messageType === "user" ? "justify-end" : "justify-start"
//       }`}
//     >
//       <div
//         className={`max-w-xs md:max-w-md px-4 py-3 rounded-lg ${
//           messageType === "user"
//             ? "bg-blue-600 text-white"
//             : "bg-slate-600 text-white"
//         }`}
//       >
//         {message?.audioUrl ? (
//           <div className="space-y-2">
//             <div className="flex items-center gap-3">
//               <button
//                 onClick={() => playAudio(message?.audioUrl, message?.id)}
//                 className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
//               >
//                 {playingAudioId === message?.id ? (
//                   <span className="text-xl">⏸</span>
//                 ) : (
//                   <span className="text-xl">▶</span>
//                 )}
//               </button>
//               <div className="flex-1">
//                 <AudioWaveform
//                   isPlaying={playingAudioId === message?.id}
//                   messageId={message?.id}
//                   playingAudioId={playingAudioId}
//                 />
//               </div>
//             </div>
//             {message?.content !== "🎤 Voice message" && (
//               <p className="text-sm mt-2">{message?.content}</p>
//             )}
//           </div>
//         ) : (
//           <p>{message?.content}</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Message;
