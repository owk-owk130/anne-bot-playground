import type { Message } from "ai";

interface Props {
  message: Message;
}

export const MessageItem = ({ message }: Props) => {
  // メッセージから画像データを分離
  const messageContent = message.content.replace(
    /画像データ:\s*data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g,
    ""
  );

  const imageMatch = message.content.match(
    /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/
  );
  const imageData = imageMatch ? imageMatch[0] : null;

  return (
    <div className="mb-4">
      <div
        className={`p-3 rounded-lg max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl ${
          message.role === "user"
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
            message.role === "assistant"
              ? "text-gray-800 dark:text-gray-200"
              : ""
          }`}
        >
          {messageContent.trim()}
        </div>
      </div>
    </div>
  );
};
