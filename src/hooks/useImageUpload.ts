"use client";

import { type ChangeEvent, useRef, useState } from "react";

import type { CreateMessage } from "ai";

interface Props {
  isAIProcessing: boolean;
  append: (message: CreateMessage) => Promise<string | null | undefined>;
}

export const useImageUpload = ({ isAIProcessing, append }: Props) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 画像アップロード処理
  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setSelectedImage(imageDataUrl);
    };
    reader.readAsDataURL(file);
  };

  // 画像分析開始処理
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
      console.error("画像分析中にエラーが発生しました:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // 画像選択キャンセル処理
  const handleImageCancel = () => {
    setSelectedImage(null);
    setImagePrompt("");
  };

  // ファイル選択ダイアログを開く
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return {
    isUploading,
    selectedImage,
    imagePrompt,
    fileInputRef,
    setImagePrompt,
    handleImageUpload,
    handleImageAnalysis,
    handleImageCancel,
    openFileDialog
  };
};
