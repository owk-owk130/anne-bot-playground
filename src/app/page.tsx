"use client";

import { useChat } from "@ai-sdk/react";
import type { Message } from "ai";
import {
  type ChangeEvent,
  use,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import ThreadSidebar from "~/components/ThreadSidebar";
import { useAuth } from "~/lib/auth/AuthProvider";

export default function Chat() {
  const { user, loading } = useAuth();
  const [sessionId, setSessionId] = useState<string>("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const hasLoadedHistoryRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    error,
    append,
    setMessages,
    status,
    reload
  } = useChat({
    api: "/api/chat",
    headers: {
      "x-session-id": sessionId,
      "x-user-id": user?.id || ""
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
    const initializeSession = async () => {
      if (loading) return;
      if (!user) {
        // ゲストユーザー用の一時セッション作成
        setMessages([]);
        setIsLoadingHistory(false);
        hasLoadedHistoryRef.current = true;
        if (typeof window !== "undefined") {
          let guestSessionId = localStorage.getItem("guest_sessionId");
          if (!guestSessionId) {
            guestSessionId = `guest-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem("guest_sessionId", guestSessionId);
          }
          setSessionId(guestSessionId);
        }
        return;
      }
      if (typeof window !== "undefined") {
        setIsLoadingHistory(true);
        const userSessionKey = `sessionId_${user.id}`;
        const storedSessionId = localStorage.getItem(userSessionKey);
        let targetSessionId = storedSessionId;
        if (!targetSessionId) {
          targetSessionId = `session-${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          localStorage.setItem(userSessionKey, targetSessionId);
        }
        setSessionId(targetSessionId);
        if (!hasLoadedHistoryRef.current) {
          try {
            const response = await fetch(
              `/api/chat?sessionId=${targetSessionId}&userId=${user.id}`,
              {
                method: "GET",
                headers: { "Content-Type": "application/json" }
              }
            );
            if (response.ok) {
              const data = await response.json();
              if (Array.isArray(data.messages) && data.messages.length > 0) {
                setMessages(data.messages);
              } else {
                setMessages([]);
              }
            } else {
              setMessages([]);
            }
            hasLoadedHistoryRef.current = true;
          } catch {
            setMessages([]);
            hasLoadedHistoryRef.current = true;
          }
        }
        setIsLoadingHistory(false);
      }
    };
    initializeSession();
  }, [loading, user, setMessages]);

  const handleNewThread = useCallback(async () => {
    if (!user) {
      // ゲストユーザー用の新しいセッション
      const newGuestSessionId = `guest-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      if (typeof window !== "undefined") {
        localStorage.setItem("guest_sessionId", newGuestSessionId);
      }
      setMessages([]);
      setSessionId(newGuestSessionId);
      hasLoadedHistoryRef.current = true;
      setSelectedImage(null);
      setImagePrompt("");
      if (reload) {
        setTimeout(() => {
          reload();
        }, 100);
      }
      return;
    }
    const newSessionId = `session-${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    try {
      const { createClientComponentClient } = await import(
        "~/lib/supabase/client"
      );
      const supabase = createClientComponentClient();
      await supabase.from("user_threads").upsert(
        {
          user_id: user.id,
          thread_id: newSessionId,
          title: "New Thread",
          updated_at: new Date().toISOString()
        },
        {
          onConflict: "user_id,thread_id"
        }
      );
    } catch {}
    if (typeof window !== "undefined") {
      const userSessionKey = `sessionId_${user.id}`;
      localStorage.setItem(userSessionKey, newSessionId);
    }
    setMessages([]);
    setSessionId(newSessionId);
    hasLoadedHistoryRef.current = true;
    setSelectedImage(null);
    setImagePrompt("");
    if (reload) {
      setTimeout(() => {
        reload();
      }, 100);
    }
  }, [user, setMessages, reload]);

  const handleThreadSelect = useCallback(
    async (threadId: string) => {
      if (!user) return;
      setIsLoadingHistory(true);
      try {
        if (typeof window !== "undefined") {
          const userSessionKey = `sessionId_${user.id}`;
          localStorage.setItem(userSessionKey, threadId);
        }
        setSessionId(threadId);
        const response = await fetch(
          `/api/chat?sessionId=${threadId}&userId=${user.id}`
        );
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        } else {
          setMessages([]);
        }
        hasLoadedHistoryRef.current = true;
        setSelectedImage(null);
        setImagePrompt("");
      } catch {
        setMessages([]);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [user, setMessages]
  );

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
    } finally {
      setIsUploading(false);
    }
  };

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

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* サイドバー */}
      <ThreadSidebar
        onNewThread={handleNewThread}
        onThreadSelect={handleThreadSelect}
        currentThreadId={sessionId}
      />

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
