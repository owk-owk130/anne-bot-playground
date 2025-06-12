interface Props {
  selectedImage: string;
  imagePrompt: string;
  isAIProcessing: boolean;
  onImagePromptChange: (value: string) => void;
  onImageAnalysis: () => void;
  onImageCancel: () => void;
}

export const ImagePreview = ({
  selectedImage,
  imagePrompt,
  isAIProcessing,
  onImagePromptChange,
  onImageAnalysis,
  onImageCancel
}: Props) => {
  return (
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
            onChange={(e) => onImagePromptChange(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <div className="flex space-x-2 mt-2">
            <button
              type="button"
              onClick={onImageAnalysis}
              disabled={isAIProcessing}
              className="px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white rounded-lg"
            >
              分析開始
            </button>
            <button
              type="button"
              onClick={onImageCancel}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
