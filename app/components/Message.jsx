const Message = ({
  message,
  formatDuration,
  playingAudioId,
  playAudio,
  finalDuration
}) => {
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
            {message?.content !== "🎤 Voice message" && (
              <p className="text-sm mt-2">{message?.content}</p>
            )}
            {messageType === "user" && (
              <div className="text-right text-xs mt-1">
                {formatDuration(finalDuration)}
              </div>
            )}
          </div>
        ) : (
          <div>
            <p>{message?.content}</p>
            {messageType === "user" && (
              <div className="text-right text-xs mt-1 text-gray-600">
                {formatDuration(finalDuration)}
              </div>
            )}
          </div>
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

// const Message = ({
//   message,
//   formatDuration,
//   playingAudioId,
//   playAudio,
//   userDuration,
//   assistantDuration,
// }) => {
//   const messageType = message?.type || "assistant";

//   return (
//     <div
//       className={`flex gap-3 ${
//         messageType === "user" ? "justify-end" : "justify-start"
//       }`}
//     >
//       {/* Avatar for assistant (left side) */}
//       {messageType === "assistant" && (
//         <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-800 via-pink-200 to-orange-100 shadow-lg"></div>
//       )}

//       <div
//         className={`max-w-xs md:max-w-md px-4 py-3 rounded-lg ${
//           messageType === "user"
//             ? "bg-gray-300 text-gray-600"
//             : "bg-black text-white"
//         }`}
//       >
//         {message?.audioUrl ? (
//           <div className="space-y-2">
//             {message?.content !== "🎤 Voice message" && (
//               <p className="text-sm mt-2">{message?.content}</p>
//             )}
//             <div className="text-right text-xs mt-1">
//               {messageType === "user"
//                 ? formatDuration(userDuration)
//                 : formatDuration(assistantDuration)}
//             </div>
//           </div>
//         ) : (
//           <div>
//             <p>{message?.content}</p>
//             <div
//               className={`text-right text-xs mt-1 ${
//                 messageType === "user" ? "text-gray-600" : "text-white"
//               }`}
//             >
//               {messageType === "user"
//                 ? formatDuration(userDuration)
//                 : formatDuration(assistantDuration)}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Avatar for user (right side) */}
//       {messageType === "user" && (
//         <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-lg flex items-center justify-center text-white font-semibold">
//           U
//         </div>
//       )}
//     </div>
//   );
// };

// export default Message;
