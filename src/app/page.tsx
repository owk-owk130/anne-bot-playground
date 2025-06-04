"use client";

import { useChat } from "@ai-sdk/react";
import { type ChangeEvent, useRef, useState, useEffect } from "react";
import type { Message } from "ai";

export default function Chat() {
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    const storedSessionId = localStorage.getItem("chat-session-id");
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("chat-session-id", newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  const { messages, input, handleInputChange, handleSubmit, error, append } =
    useChat({
      api: "/api/chat",
      headers: {
        "x-session-id": sessionId
      }
    });
  const [isUploading, setIsUploading] = useState(false);
  const [imageMessages, setImageMessages] = useState<{ [key: string]: string }>(
    {}
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageDataUrl = e.target?.result as string;
      const imageId = `img-${Date.now()}`;

      setImageMessages((prev) => ({
        ...prev,
        [imageId]: imageDataUrl
      }));

      try {
        await append({
          role: "user",
          content: `今の表情や気分を教えて！ [${imageId}]\n\n画像データ: ${imageDataUrl}`
        });
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleNewSession = () => {
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("chat-session-id", newSessionId);
    setSessionId(newSessionId);
    window.location.reload();
  };

  const renderMessage = (message: Message) => {
    const imageIdMatch = message.content.match(/\[img-\d+\]/);
    const imageId = imageIdMatch ? imageIdMatch[0].slice(1, -1) : null;

    const cleanContent = message.content
      .replace(/\s*\[img-\d+\]/, "")
      .replace(
        /\n\n画像データ:\s*data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/,
        ""
      );

    return (
      <div key={message.id} className="whitespace-pre-wrap mb-4">
        <strong>{message.role === "user" ? "けんご: " : "あん: "}</strong>
        <div className="mt-1">
          {imageId && imageMessages[imageId] && (
            <img
              src={imageMessages[imageId]}
              alt="アップロードされた画像"
              className="max-w-xs rounded-lg mb-2"
            />
          )}
          {cleanContent}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          エラー: {error.message}
        </div>
      )}

      {messages.map((m) => renderMessage(m))}

      {isUploading && (
        <div className="whitespace-pre-wrap mb-4">
          <strong>あん: </strong>
          <div className="mt-1 text-gray-600">画像を分析しています...🐱</div>
        </div>
      )}

      <div className="fixed bottom-0 w-full max-w-md">
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={handleImageButtonClick}
            disabled={isUploading}
            className={`px-4 py-2 rounded transition-colors ${
              isUploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-pink-500 hover:bg-pink-600"
            } text-white`}
          >
            {isUploading ? "📷 分析中..." : "📷 画像から今の気分を教えて"}
          </button>
          <button
            type="button"
            onClick={handleNewSession}
            className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors text-sm"
            title="新しい会話を開始"
          >
            🔄
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        <form onSubmit={handleSubmit}>
          <input
            className="w-full p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl dark:bg-zinc-900"
            value={input}
            placeholder="メッセージを入力..."
            onChange={handleInputChange}
          />
        </form>
      </div>
    </div>
  );
}
