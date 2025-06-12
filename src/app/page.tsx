"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { ThreadSidebar } from "~/components/ThreadSidebar";
import { MessageItem } from "~/components/MessageItem";
import { ImagePreview } from "~/components/ImagePreview";
import { ChatInputForm } from "~/components/ChatInputForm";
import { useAuth } from "~/lib/auth/AuthProvider";
import { useSessionManager } from "~/hooks/useSessionManager";
import { useImageUpload } from "~/hooks/useImageUpload";

export default function Chat() {
  const { user, loading } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 初期状態でsessionIdを空文字列として設定
  const [currentSessionId, setCurrentSessionId] = useState("");

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
      "x-session-id": currentSessionId,
      "x-user-id": user?.id || ""
    }
  });

  const { sessionId, isLoadingHistory, handleNewThread, handleThreadSelect } =
    useSessionManager({ setMessages, reload });

  // sessionIdが変更されたときにcurrentSessionIdを更新
  useEffect(() => {
    if (sessionId && sessionId !== currentSessionId) {
      setCurrentSessionId(sessionId);
    }
  }, [sessionId, currentSessionId]);

  // 画像アップロードフックを使用
  const {
    isUploading,
    selectedImage,
    imagePrompt,
    fileInputRef,
    setImagePrompt,
    handleImageUpload,
    handleImageAnalysis,
    handleImageCancel,
    openFileDialog
  } = useImageUpload({
    isAIProcessing: status === "submitted" || status === "streaming",
    append
  });

  // 判定用の変数
  const isAIProcessing = status === "submitted" || status === "streaming";

  // メッセージが更新されたときに自動スクロール
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // フォーム送信ハンドラー
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
  };

  // ローディング中の表示
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
            messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))
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
          <ImagePreview
            selectedImage={selectedImage}
            imagePrompt={imagePrompt}
            isAIProcessing={isAIProcessing}
            onImagePromptChange={setImagePrompt}
            onImageAnalysis={handleImageAnalysis}
            onImageCancel={handleImageCancel}
          />
        )}

        {/* 入力エリア */}
        <ChatInputForm
          input={input}
          isAIProcessing={isAIProcessing}
          selectedImage={selectedImage}
          fileInputRef={fileInputRef}
          onInputChange={handleInputChange}
          onSubmit={handleFormSubmit}
          onImageUpload={handleImageUpload}
          onFileDialogOpen={openFileDialog}
        />
      </div>
    </div>
  );
}
