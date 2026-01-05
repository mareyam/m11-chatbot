const Header = ({ clearChat }) => (
  <div className="bg-transparent p-4">
    <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0">
      <h1 className="text-xl md:text-2xl font-bold text-gray-700 text-center md:text-left">
        AI Voice Assistant
      </h1>
      <button
        onClick={clearChat}
        className="rounded-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors w-full md:w-auto"
      >
        Clear Chat
      </button>
    </div>
  </div>
);

export default Header;
