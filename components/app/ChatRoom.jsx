"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Users, LogOut } from "lucide-react";

const ChatRoom = ({ socket, initialData, roomId, username, onLeaveRoom }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(initialData.messages || []);
  const [users, setUsers] = useState(initialData.users || []);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on("newMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("userJoined", ({ username }) => {
      setUsers((prev) => [...new Set([...prev, username])]);
    });

    socket.on("userLeft", ({ username }) => {
      setUsers((prev) => prev.filter((user) => user !== username));
    });

    return () => {
      socket.off("newMessage");
      socket.off("userJoined");
      socket.off("userLeft");
    };
  }, [socket]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    socket.emit("sendMessage", {
      roomId,
      message: message.trim(),
    });

    setMessage("");
  };

  const handleLeaveRoom = () => {
    socket.emit("leaveRoom", { roomId, username });
    onLeaveRoom();
  };

  return (
    <div className="h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        <div className="flex-1 flex gap-4">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-white rounded-lg shadow-lg">
            {/* Chat Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Room: {roomId}</h2>
              <Button variant="outline" onClick={handleLeaveRoom}>
                <LogOut className="h-4 w-4 mr-2" />
                Leave Room
              </Button>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.user === username ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm">{msg.user}</span>
                      <span className="text-xs text-gray-500">{msg.time}</span>
                    </div>
                    <div
                      className={`rounded-lg p-3 mt-1 max-w-[80%] ${
                        msg.user === username
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button type="submit">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          {/* Users Sidebar */}
          <Card className="w-64 h-full">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5" />
                <h3 className="font-semibold">Online Users ({users.length})</h3>
              </div>
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span
                        className={user === username ? "font-semibold" : ""}
                      >
                        {user} {user === username && "(You)"}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
