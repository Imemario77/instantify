// ChatLogin.jsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare } from "lucide-react";

const ChatLogin = ({ socket, onJoinSuccess }) => {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  useEffect(() => {
    socket.on("error", (message) => {
      setError(message);
    });

    socket.on("roomCreated", ({ roomId }) => {
      handleJoinRoom(roomId, password, username);
    });

    socket.on("roomJoined", (roomData) => {
      onJoinSuccess(roomData, roomId, username);
    });

    return () => {
      socket.off("error");
      socket.off("roomCreated");
      socket.off("roomJoined");
    };
  }, [socket, username, password, roomId, onJoinSuccess]);

  const handleJoinRoom = (roomId, password, username) => {
    if (!username || !roomId || !password) {
      setError("Please fill in all fields");
      return;
    }

    socket.emit("joinRoom", { roomId, password, username });
  };

  const handleCreateRoom = () => {
    if (!username || !roomId || !password) {
      setError("Please fill in all fields");
      return;
    }

    socket.emit("createRoom", { roomId, password, username });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <MessageSquare size={32} className="text-blue-500" />
          </div>
          <CardTitle className="text-2xl text-center">
            {isCreatingRoom ? "Create Chat Room" : "Join Chat Room"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              isCreatingRoom
                ? handleCreateRoom()
                : handleJoinRoom(roomId, password, username);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Room Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            onClick={() => {
              isCreatingRoom
                ? handleCreateRoom()
                : handleJoinRoom(roomId, password, username);
            }}
            className="w-full"
          >
            {isCreatingRoom ? "Create Room" : "Join Room"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsCreatingRoom(!isCreatingRoom)}
            className="w-full"
          >
            {isCreatingRoom ? "Back to Join Room" : "Create New Room"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
export default ChatLogin;
