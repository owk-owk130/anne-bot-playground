"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthCodeErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case "no_code":
        return "OAuth認証コードが見つかりません。認証フローを最初からやり直してください。";
      case "exchange_failed":
        return "OAuth認証コードの交換に失敗しました。";
      case "session_failed":
        return "セッションの設定に失敗しました。";
      case "no_auth_data":
        return "認証データが見つかりませんでした。";
      case "callback_exception":
        return "認証コールバック処理中にエラーが発生しました。";
      case "exception":
        return "認証処理中に予期しないエラーが発生しました。";
      default:
        return "認証に失敗しました。もう一度お試しください。";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg text-center">
        <div>
          <h1 className="text-3xl font-bold text-red-600 mb-4">
            ログインエラー
          </h1>
          <p className="text-gray-600 mb-6">{getErrorMessage(error)}</p>
          {error && (
            <p className="text-sm text-gray-500 mb-4">エラーコード: {error}</p>
          )}
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="block bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            ホームに戻る
          </Link>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="block w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            再度ログインを試す
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthCodeError() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
          <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg text-center">
            <div className="text-gray-600">読み込み中...</div>
          </div>
        </div>
      }
    >
      <AuthCodeErrorContent />
    </Suspense>
  );
}
