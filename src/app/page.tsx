"use client";

import { useChat } from "@ai-sdk/react";
import {
  type ChangeEvent,
  useRef,
  useState,
  useEffect,
  useCallback,
  use
} from "react";
import type { Message } from "ai";
import { useAuth } from "~/lib/auth/AuthProvider";
import ThreadSidebar from "~/components/ThreadSidebar";

export default function Chat() {
  const { user, loading } = useAuth();
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
    console.log("User state changed:", user);
  }, [user]);

  useEffect(() => {
    const initializeApp = async () => {
      if (loading) return;

      if (!sessionId && typeof window !== "undefined") {
        setIsLoadingHistory(true);

        let newSessionId = localStorage.getItem("sessionId");

        if (!newSessionId) {
          newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          localStorage.setItem("sessionId", newSessionId);
        }

        setSessionId(newSessionId);

        // 前回のメッセージを復元
        try {
          console.log("Fetching messages for session:", newSessionId);
          const response = await fetch(`/api/chat?sessionId=${newSessionId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
          });

          console.log("Response status:", response.status);

          if (response.ok) {
            const data = await response.json();
            console.log("Loaded messages:", data);
            if (Array.isArray(data.messages) && data.messages.length > 0) {
              setMessages(data.messages);
            } else {
              setMessages([]);
            }
          } else {
            console.error(
              "Response not ok:",
              response.status,
              response.statusText
            );
            const errorData = await response.text();
            console.error("Error response:", errorData);
            setMessages([]);
          }
        } catch (error) {
          console.error("Error loading messages:", error);
          setMessages([]);
        }

        setIsLoadingHistory(false);
      }
    };

    initializeApp();
  }, [loading, sessionId, setMessages]);

  // 新しい会話を開始
  const handleNewThread = useCallback(() => {
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 全ユーザー共通でlocalStorageに新しいセッションIDを保存
    if (typeof window !== "undefined") {
      localStorage.setItem("sessionId", newSessionId);
    }

    setSessionId(newSessionId);
    setMessages([]);
    setSelectedImage(null);
    setImagePrompt("");
  }, [setMessages]);

  // メッセージが更新されたときにスクロール
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  });

  // 画像アップロード処理
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

  // 画像分析処理
  const handleImageAnalysis = async () => {
    if (!selectedImage || isAIProcessing) return;

    setIsUploading(true);

    try {
      const imageMessage = `画像を分析してください。${imagePrompt || "この画像について教えてください。"}`;
      const fullMessage = `${imageMessage}\n\n画像データ: ${selectedImage}`;

      await append({
        role: "user",
        content: fullMessage
      });

      setSelectedImage(null);
      setImagePrompt("");
    } catch (error) {
      console.error("Error analyzing image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // メッセージレンダリング
  const renderMessage = (m: Message) => {
    const messageContent = m.content.replace(
      /画像データ:\s*data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g,
      ""
    );

    const imageMatch = m.content.match(
      /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/
    );
    const imageData = imageMatch ? imageMatch[0] : null;

    return (
      <div key={m.id} className="mb-4">
        <div
          className={`p-3 rounded-lg max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl ${
            m.role === "user"
              ? "bg-pink-500 text-white ml-auto"
              : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          }`}
        >
          {imageData && (
            <div className="mb-2">
              <img
                src={imageData}
                alt="Uploaded"
                className="max-w-full h-auto rounded"
                style={{ maxHeight: "200px" }}
              />
            </div>
          )}
          <div
            className={`whitespace-pre-wrap ${
              m.role === "assistant" ? "text-gray-800 dark:text-gray-200" : ""
            }`}
          >
            {messageContent.trim()}
          </div>
        </div>
      </div>
    );
  };

  // フォーム送信処理
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      handleSubmit(e);
    } catch (error) {
      console.error("Error in message submission:", error);
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* サイドバー */}
      <ThreadSidebar onNewThread={handleNewThread} />

      {/* メインチャットエリア */}
      <div className="flex-1 flex flex-col md:ml-80">
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
                <span className="animate-pulse">
                  チャット履歴を読み込み中...
                </span>
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
            <div className="mb-4 text-center text-gray-600 dark:text-gray-400">
              <span className="animate-pulse">画像を分析中...</span>
            </div>
          )}

          {isAIProcessing && (
            <div className="mb-4">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span>考え中...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 画像プレビューエリア */}
        {selectedImage && (
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-4">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-20 h-20 object-cover rounded"
              />
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="画像について質問や説明を入力..."
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={handleImageAnalysis}
                    disabled={isAIProcessing}
                    className="px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white rounded-lg"
                  >
                    分析開始
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 入力エリア */}
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleFormSubmit} className="flex space-x-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              ref={fileInputRef}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
              title="画像をアップロード"
            >
              📷
            </button>

            <input
              value={input}
              placeholder="メッセージを入力..."
              onChange={handleInputChange}
              disabled={isAIProcessing || selectedImage !== null}
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
            <button
              type="submit"
              disabled={
                isAIProcessing || !input.trim() || selectedImage !== null
              }
              className="px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white rounded-lg"
            >
              送信
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
