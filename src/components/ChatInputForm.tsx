import type { RefObject } from "react";

interface Props {
  input: string;
  isAIProcessing: boolean;
  selectedImage: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDialogOpen: () => void;
}

export const ChatInputForm = ({
  input,
  isAIProcessing,
  selectedImage,
  fileInputRef,
  onInputChange,
  onSubmit,
  onImageUpload,
  onFileDialogOpen
}: Props) => {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <form onSubmit={onSubmit} className="flex space-x-2">
        <input
          type="file"
          accept="image/*"
          onChange={onImageUpload}
          ref={fileInputRef}
          className="hidden"
        />

        <button
          type="button"
          onClick={onFileDialogOpen}
          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
          title="画像をアップロード"
        >
          📷
        </button>

        <input
          value={input}
          placeholder="メッセージを入力..."
          onChange={onInputChange}
          disabled={isAIProcessing || selectedImage !== null}
          className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800"
        />
        <button
          type="submit"
          disabled={isAIProcessing || !input.trim() || selectedImage !== null}
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white rounded-lg"
        >
          送信
        </button>
      </form>
    </div>
  );
};
