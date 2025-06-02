"use client";

import { useChat } from "@ai-sdk/react";
import { type ChangeEvent, useRef } from "react";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, error, append } =
    useChat();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageDataUrl = e.target?.result as string;

      try {
        await append({
          role: "user",
          content: `この画像を見て、今の表情や気分を教えて！\n\n画像データ: ${imageDataUrl}`
        });
      } catch (error) {
        console.error("Error sending message:", error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          エラー: {error.message}
        </div>
      )}

      {messages.map((m) => (
        <div key={m.id} className="whitespace-pre-wrap mb-2">
          <strong>{m.role === "user" ? "けんご: " : "あん: "}</strong>
          {m.content.includes("data:image/") ? (
            <div>
              <div>{m.content.split("\n")[0]}</div>
              <img
                src={m.content.split("画像データ: ")[1]}
                alt="アップロードされた画像"
                className="max-w-full h-auto rounded mt-2 mb-2 max-h-48"
              />
            </div>
          ) : (
            m.content
          )}
        </div>
      ))}

      <div className="fixed bottom-0 w-full max-w-md">
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={handleImageButtonClick}
            className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors"
          >
            📷 画像アップロード
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
