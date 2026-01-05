const InputArea = ({
  inputText,
  setInputText,
  sendTextMessage,
  startRecording,
  stopRecording,
  isRecording,
  recordingDuration,
  isLoading,
  formatDuration,
}) => (
  <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-3 md:p-4 shadow-lg mx-4 mb-4">
    <div className="flex flex-col md:flex-row gap-2 items-center">
      <input
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && sendTextMessage()}
        placeholder="Enter your message"
        disabled={isLoading || isRecording}
        className="flex-1 px-4 py-3 rounded-full bg-white text-gray-700 border-0 focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder-gray-400 w-full md:w-auto"
      />

      <div className="flex gap-2 mt-2 md:mt-0">
        <button
          onClick={() => {
            sendTextMessage();
            setInputText("");
          }}
          disabled={isLoading || isRecording || !inputText.trim()}
          className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:opacity-50 text-gray-600 rounded-full transition-colors"
          title="Send"
        >
          ↑
        </button>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
          className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:opacity-50 text-gray-600 rounded-full transition-colors"
          title={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? "⏹" : "🎤"}
        </button>
      </div>
    </div>

    {isRecording && (
      <div className="text-center text-red-500 text-sm mt-2 animate-pulse">
        Recording: {formatDuration(recordingDuration)}
      </div>
    )}
  </div>
);
export default InputArea;

// const InputArea = ({
//   inputText,
//   setInputText,
//   sendTextMessage,
//   startRecording,
//   stopRecording,
//   isRecording,
//   recordingDuration,
//   isLoading,
//   formatDuration,
// }) => (
//   <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-4 shadow-lg mx-4 mb-4">
//     <div className="flex gap-2 items-center">
//       <input
//         type="text"
//         value={inputText}
//         onChange={(e) => setInputText(e.target.value)}
//         onKeyPress={(e) => e.key === "Enter" && sendTextMessage()}
//         placeholder="Enter your message"
//         disabled={isLoading || isRecording}
//         className="flex-1 px-4 py-3 rounded-full bg-white text-gray-700 border-0 focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder-gray-400"
//       />

//       <button
//         onClick={() => {
//           sendTextMessage();
//           setInputText("");
//         }}
//         disabled={isLoading || isRecording || !inputText.trim()}
//         className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:opacity-50 text-gray-600 rounded-full transition-colors"
//         title="Send"
//       >
//         ↑
//       </button>

//       <button
//         onClick={isRecording ? stopRecording : startRecording}
//         disabled={isLoading}
//         className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:opacity-50 text-gray-600 rounded-full transition-colors"
//         title={isRecording ? "Stop recording" : "Start recording"}
//       >
//         {isRecording ? "⏹" : "🎤"}
//       </button>
//     </div>
//     {isRecording && (
//       <div className="text-center text-red-500 text-sm mt-2 animate-pulse">
//         Recording: {formatDuration(recordingDuration)}
//       </div>
//     )}
//   </div>
// );

// export default InputArea;
// // const InputArea = ({
// //   inputText,
// //   setInputText,
// //   sendTextMessage,
// //   startRecording,
// //   stopRecording,
// //   isRecording,
// //   recordingDuration,
// //   isLoading,
// //   formatDuration,
// // }) => (
// //   <div className="bg-slate-800 rounded-b-lg p-4 shadow-lg">
// //     <div className="flex gap-2">
// //       <input
// //         type="text"
// //         value={inputText}
// //         onChange={(e) => setInputText(e.target.value)}
// //         onKeyPress={(e) => e.key === "Enter" && sendTextMessage()}
// //         placeholder="Type your message..."
// //         disabled={isLoading || isRecording}
// //         className="flex-1 px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
// //       />

// //       <button
// //         onClick={() => {
// //           sendTextMessage();
// //           setInputText("");
// //         }}
// //         disabled={isLoading || isRecording || !inputText.trim()}
// //         className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg transition-colors"
// //       >
// //         Send
// //       </button>

// //       <button
// //         onClick={isRecording ? stopRecording : startRecording}
// //         disabled={isLoading}
// //         className={`px-6 py-2 rounded-lg transition-colors ${
// //           isRecording
// //             ? "bg-red-600 hover:bg-red-700 animate-pulse"
// //             : "bg-green-600 hover:bg-green-700"
// //         } text-white`}
// //       >
// //         {isRecording ? `🔴 ${formatDuration(recordingDuration)}` : "🎤 Record"}
// //       </button>
// //     </div>
// //   </div>
// // );

// // export default InputArea;
