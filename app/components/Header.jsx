const Header = ({ clearChat }) => (
  <div className="bg-transparent p-4">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-700">AI Voice Assistant</h1>
      <button
        onClick={clearChat}
        className="rounded-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
      >
        Clear Chat
      </button>
    </div>
  </div>
);

export default Header;
