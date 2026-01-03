const AudioWaveform = ({ isPlaying, messageId, playingAudioId }) => {
  const bars = 40;
  const isActive = playingAudioId === messageId;

  return (
    <div className="flex items-center gap-0.5 h-8">
      {[...Array(bars)].map((_, i) => {
        const height = isActive
          ? Math.random() * 100 + 20
          : Math.sin(i * 0.5) * 30 + 40;

        return (
          <div
            key={i}
            className={`w-1 bg-current rounded-full transition-all duration-150 ${
              isActive ? "animate-pulse" : ""
            }`}
            style={{
              height: `${height}%`,
              animationDelay: `${i * 50}ms`,
            }}
          />
        );
      })}
    </div>
  );
};

export default AudioWaveform;
