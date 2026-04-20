function WhiteboardPanel({ sessionId }) {
  return (
    <div className="h-full w-full bg-base-100 flex flex-col items-center justify-center relative">
      <iframe
        src={`https://wbo.ophir.dev/boards/deviq-${sessionId}`}
        title="Collaborative Whiteboard"
        className="w-full h-full border-none"
        allow="camera; microphone"
      ></iframe>
    </div>
  );
}

export default WhiteboardPanel;
