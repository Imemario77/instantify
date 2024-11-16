// App.jsx
"use client";

import React, { useState, useEffect } from "react";
import ChatLogin from "@/components/app/ChatLogin";
import ChatRoom from "@/components/app/ChatRoom";
import { io } from "socket.io-client";

const socket = io("http://localhost:5050");

const App = () => {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [username, setUsername] = useState("");

  const handleJoinSuccess = (data, roomId, username) => {
    setRoomData(data);
    setCurrentRoom(roomId);
    setUsername(username);
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setRoomData(null);
    setUsername("");
  };

  return (
    <>
      {!currentRoom ? (
        <ChatLogin socket={socket} onJoinSuccess={handleJoinSuccess} />
      ) : (
        <ChatRoom
          socket={socket}
          initialData={roomData}
          roomId={currentRoom}
          username={username}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </>
  );
};

export default App;
