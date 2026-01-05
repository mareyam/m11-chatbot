import Message from "./Message";

const MessagesArea = ({
  messages,
  isLoading,
  messagesEndRef,
  playingAudioId,
  playAudio,
  finalDuration,
  formatDuration,
}) => (
  <div className="flex-1 bg-transparent p-4 overflow-y-auto space-y-4">
    {messages.length === 0 && (
      <div className="text-center text-gray-500 mt-8">
        <p>Start a conversation by typing or using voice input</p>
      </div>
    )}

    {messages.map((msg, index) => (
      <Message
        key={index}
        message={msg}
        playingAudioId={playingAudioId}
        playAudio={playAudio}
        finalDuration={finalDuration}
        formatDuration={formatDuration}
      />
    ))}

    {isLoading && (
      <div className="flex justify-start">
        <div className="bg-black text-white px-4 py-2 rounded-lg">
          <p>Thinking...</p>
        </div>
      </div>
    )}

    <div ref={messagesEndRef} />
  </div>
);

export default MessagesArea;
// import Message from "./Message";
// const MessagesArea = ({
//   messages,
//   isLoading,
//   messagesEndRef,
//   playingAudioId,
//   playAudio,
// }) => (
//   <div className="flex-1 bg-slate-700 p-4 overflow-y-auto space-y-4">
//     {messages.length === 0 && (
//       <div className="text-center text-slate-400 mt-8">
//         <p>Start a conversation by typing or using voice input</p>
//       </div>
//     )}

//     {messages.map((msg, index) => (
//       <Message
//         key={index}
//         message={msg}
//         playingAudioId={playingAudioId}
//         playAudio={playAudio}
//       />
//     ))}

//     {isLoading && (
//       <div className="flex justify-start">
//         <div className="bg-slate-600 text-white px-4 py-2 rounded-lg">
//           <p>Thinking...</p>
//         </div>
//       </div>
//     )}

//     <div ref={messagesEndRef} />
//   </div>
// );

// export default MessagesArea;

// // import Message from "./Message";

// // const MessagesArea = ({
// //   messages,
// //   isLoading,
// //   messagesEndRef,
// //   playingAudioId,
// //   playAudio,
// // }) => (
// //   <div className="flex-1 bg-slate-700 p-4 overflow-y-auto space-y-4">
// //     {messages.length === 0 && (
// //       <div className="text-center text-slate-400 mt-8">
// //         <p>Start a conversation by typing or using voice input</p>
// //       </div>
// //     )}

// //     {messages.map((msg, index) => (
// //       <Message
// //         key={index}
// //         message={msg}
// //         playingAudioId={playingAudioId}
// //         playAudio={playAudio}
// //       />
// //     ))}

// //     {isLoading && (
// //       <div className="flex justify-start">
// //         <div className="bg-slate-600 text-white px-4 py-2 rounded-lg">
// //           <p>Thinking...</p>
// //         </div>
// //       </div>
// //     )}

// //     <div ref={messagesEndRef} />
// //   </div>
// // );

// // export default MessagesArea;
