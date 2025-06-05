"use client";

import { useChat } from "@ai-sdk/react";
import { type ChangeEvent, useRef, useState, useEffect } from "react";
import type { Message } from "ai";

export default function Chat() {
  const [sessionId, setSessionId] = useState<string>("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    error,
    append,
    setMessages,
    status
  } = useChat({
    api: "/api/chat",
    headers: {
      "x-session-id": sessionId
    }
  });
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAIProcessing = status === "submitted" || status === "streaming";

  useEffect(() => {
    const initializeChat = async () => {
      let currentSessionId = localStorage.getItem("chat-session-id");
      if (!currentSessionId) {
        currentSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem("chat-session-id", currentSessionId);
      }
      setSessionId(currentSessionId);

      try {
        const response = await fetch(`/api/chat?sessionId=${currentSessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          }
        }
      } catch (error) {
        console.error("Error loading message history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    initializeChat();
  }, [setMessages]);

  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  });

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setSelectedImage(imageDataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSendImageWithPrompt = async () => {
    if (!selectedImage) return;

    setIsUploading(true);
    const imageId = `img-${Date.now()}`;

    try {
      const content = imagePrompt.trim()
        ? `${imagePrompt} [${imageId}]\n\n画像データ: ${selectedImage}`
        : `この画像について教えて [${imageId}]\n\n画像データ: ${selectedImage}`;

      await append({
        role: "user",
        content
      });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsUploading(false);
      setSelectedImage(null);
      setImagePrompt("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCancelImage = () => {
    setSelectedImage(null);
    setImagePrompt("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleNewSession = () => {
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("chat-session-id", newSessionId);
    setSessionId(newSessionId);
    setMessages([]);
    setSelectedImage(null);
    setImagePrompt("");
  };

  const formatMessageTime = (timestamp: Date | string | undefined) => {
    const messageTime = timestamp ? new Date(timestamp) : new Date();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(
      messageTime.getFullYear(),
      messageTime.getMonth(),
      messageTime.getDate()
    );

    const diffDays = Math.floor(
      (today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      // 今日
      return messageTime.toLocaleString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    if (diffDays === 1) {
      // 昨日
      return `昨日 ${messageTime.toLocaleString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit"
      })}`;
    }

    if (diffDays < 7) {
      // 1週間以内
      return messageTime.toLocaleString("ja-JP", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    // それ以前
    return messageTime.toLocaleString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const renderMessage = (message: Message) => {
    // メッセージから画像データを直接抽出
    const imageDataMatch = message.content.match(
      /画像データ:\s*(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)/
    );
    const imageDataUrl = imageDataMatch ? imageDataMatch[1] : null;

    const cleanContent = message.content
      .replace(/\s*\[img-\d+\]/, "")
      .replace(
        /\n\n画像データ:\s*data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/,
        ""
      );

    const isUser = message.role === "user";

    const timeString = formatMessageTime(message.createdAt);

    return (
      <div
        key={message.id}
        className={`mb-4 ${isUser ? "text-right" : "text-left"}`}
      >
        <div
          className={`inline-block max-w-[80%] p-3 rounded-lg ${
            isUser
              ? "bg-pink-500 text-white rounded-br-none"
              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none"
          }`}
        >
          <div className="text-xs opacity-70 mb-1 flex justify-between items-center">
            <span>{isUser ? "けんご" : "あん 🐱"}</span>
            <span className="text-xs opacity-60">{timeString}</span>
          </div>
          {imageDataUrl && (
            <img
              src={imageDataUrl}
              alt="アップロードされた画像"
              className="max-w-full rounded-lg mb-2"
            />
          )}
          <div className="whitespace-pre-wrap text-left">{cleanContent}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto">
      <div className="flex-1 overflow-y-auto p-4 pb-6">
        {error && (
          <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            エラー: {error.message}
          </div>
        )}

        {isLoadingHistory ? (
          <div className="whitespace-pre-wrap mb-4 text-center">
            <div className="mt-1 text-gray-600 flex items-center justify-center">
              <span className="animate-bounce mr-2">🐱</span>
              <span className="animate-pulse">チャット履歴を読み込み中...</span>
              <span className="animate-bounce ml-2">💭</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="whitespace-pre-wrap mb-4 text-center">
            <div className="mt-1 text-gray-500">
              <span className="text-2xl mb-2 block">🐱</span>
              <p>あんです！何か話しかけてくださいにゃん♪</p>
              <p className="text-sm mt-2">
                画像をアップロードして気分を聞くこともできますよ🎀
              </p>
            </div>
          </div>
        ) : (
          messages.map((m) => renderMessage(m))
        )}

        {isUploading && (
          <div className="mb-4 text-left">
            <div className="inline-block max-w-[80%] p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none">
              <div className="text-xs opacity-70 mb-1 flex justify-between items-center">
                <span>あん 🐱</span>
                <span className="text-xs opacity-60">
                  {formatMessageTime(new Date())}
                </span>
              </div>
              <div className="flex items-center">
                <span className="animate-spin mr-2">📷</span>
                <span className="animate-pulse">画像を分析しています...</span>
              </div>
            </div>
          </div>
        )}

        {isAIProcessing && !isUploading && (
          <div className="mb-4 text-left">
            <div className="inline-block max-w-[80%] p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none">
              <div className="text-xs opacity-70 mb-1 flex justify-between items-center">
                <span>あん 🐱</span>
                <span className="text-xs opacity-60">
                  {formatMessageTime(new Date())}
                </span>
              </div>
              <div className="flex items-center">
                <span className="animate-pulse">返事を考えています...</span>
                <span className="animate-bounce ml-2">💭</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 画像選択時のプレビューエリア */}
      {selectedImage && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 p-4">
          <div className="mb-3">
            <img
              src={selectedImage}
              alt="選択した画像"
              className="max-w-full max-h-40 rounded-lg mx-auto"
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="この画像について何を聞きたいですか？（例：感情、内容、詳細など）"
              className="w-full p-3 border border-zinc-300 dark:border-zinc-800 rounded-lg shadow-sm dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              disabled={isUploading}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSendImageWithPrompt}
              disabled={isUploading}
              className={`flex-1 px-4 py-2 rounded transition-colors ${
                isUploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-pink-500 hover:bg-pink-600"
              } text-white text-sm`}
            >
              {isUploading ? "送信中..." : "📤 送信"}
            </button>
            <button
              type="button"
              onClick={handleCancelImage}
              disabled={isUploading}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm"
            >
              ❌ キャンセル
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={handleImageButtonClick}
            disabled={isUploading || isAIProcessing || selectedImage !== null}
            className={`px-4 py-2 rounded transition-colors ${
              isUploading || isAIProcessing || selectedImage !== null
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-pink-500 hover:bg-pink-600"
            } text-white text-sm`}
          >
            📷 画像をアップロード
          </button>
          <button
            type="button"
            onClick={handleNewSession}
            disabled={isAIProcessing || isUploading || selectedImage !== null}
            className={`px-3 py-2 rounded transition-colors text-sm text-white ${
              isAIProcessing || isUploading || selectedImage !== null
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gray-500 hover:bg-gray-600"
            }`}
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

        {!selectedImage && (
          <form onSubmit={handleSubmit}>
            <input
              className={`w-full p-3 border border-zinc-300 dark:border-zinc-800 rounded-lg shadow-sm dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent ${
                isAIProcessing || isUploading ? "opacity-50" : ""
              }`}
              value={input}
              placeholder={
                isAIProcessing || isUploading
                  ? "送信中..."
                  : "メッセージを入力..."
              }
              onChange={handleInputChange}
              disabled={isAIProcessing || isUploading}
            />
          </form>
        )}
      </div>
    </div>
  );
}
