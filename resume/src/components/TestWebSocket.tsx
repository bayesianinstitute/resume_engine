"use client"; // Add this directive to make it a Client Component

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const TestWebSocket = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const socket = io("http://localhost:3000");

    socket.on("progress", (data) => {
      setMessages((prev) => [...prev, data.message]);
    });

    socket.on("done", (data) => {
      setMessages((prev) => [...prev, data.message]);
      setIsComplete(true);
      socket.disconnect();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>WebSocket Test</h1>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
      {isComplete && <p>WebSocket Test Complete!</p>}
    </div>
  );
};

export default TestWebSocket;
