"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "~/lib/auth/AuthProvider";
import type { Thread } from "~/types/thread";

interface Props {
  onNewThread: () => void;
  onThreadSelect: (threadId: string) => void;
  currentThreadId?: string;
}

const ThreadSidebar = ({
  onNewThread,
  onThreadSelect,
  currentThreadId
}: Props) => {
  const { user, signOut, signInWithOAuth } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    if (!user) {
      setThreads([]);
      return;
    }
    setIsLoadingThreads(true);
    try {
      const res = await fetch(`/api/threads?userId=${user.id}`);
      if (!res.ok) {
        setThreads([]);
        return;
      }
      const { threads: userThreads } = await res.json();
      const threadsWithDetails = (userThreads || []).map(
        (userThread: {
          thread_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
        }) => ({
          id: userThread.thread_id,
          title: userThread.title || "新しい会話",
          lastMessage: "会話を開いて確認",
          createdAt: userThread.created_at,
          updatedAt: userThread.updated_at
        })
      );
      setThreads(threadsWithDetails);
    } catch {
      setThreads([]);
    } finally {
      setIsLoadingThreads(false);
    }
  }, [user]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithOAuth();
    } catch {
      alert("ログイン処理中にエラーが発生しました。");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setThreads([]);
      onNewThread();
    } catch {
      alert("ログアウト処理中にエラーが発生しました。");
    }
  };

  const deleteThread = useCallback(
    async (threadId: string) => {
      if (!user || !threadId) return;
      const isConfirmed = window.confirm(
        "この会話を削除しますか？この操作は取り消せません。"
      );
      if (!isConfirmed) return;
      setDeletingThreadId(threadId);
      try {
        const res = await fetch(
          `/api/threads?userId=${user.id}&threadId=${threadId}`,
          {
            method: "DELETE"
          }
        );
        if (!res.ok) {
          alert("スレッドの削除に失敗しました。");
          return;
        }
        try {
          await fetch(`/api/chat?sessionId=${threadId}&userId=${user.id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
          });
        } catch {}
        if (currentThreadId === threadId) {
          onNewThread();
        }
        await fetchThreads();
      } catch {
        alert("スレッドの削除中にエラーが発生しました。");
      } finally {
        setDeletingThreadId(null);
      }
    },
    [user, currentThreadId, onNewThread, fetchThreads]
  );

  return (
    <>
      {/* モバイル用ハンバーガーメニューボタン */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
        aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <title>{isOpen ? "メニューを閉じる" : "メニューを開く"}</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>

      {/* サイドバー */}
      <div
        className={`fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🐱</span>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                  あんちゃっと
                </h1>
              </div>
              {/* モバイル用閉じるボタン */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="md:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="メニューを閉じる"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>閉じる</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* メインコンテンツ */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* 新しい会話ボタン */}
            <button
              type="button"
              onClick={() => {
                onNewThread();
                setIsOpen(false);
              }}
              className="w-full mb-4 px-4 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <span>💬</span>
              <span>新しい会話</span>
            </button>

            {/* スレッド一覧 */}
            {user && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    会話履歴
                  </h3>
                  <button
                    type="button"
                    onClick={fetchThreads}
                    disabled={isLoadingThreads}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="更新"
                  >
                    <svg
                      className={`w-4 h-4 ${isLoadingThreads ? "animate-spin" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <title>更新</title>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {isLoadingThreads ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto" />
                      <p className="text-xs text-gray-500 mt-2">
                        読み込み中...
                      </p>
                    </div>
                  ) : threads.length > 0 ? (
                    threads.map((thread) => (
                      <div
                        key={thread.id}
                        className={`relative group w-full p-3 rounded-lg transition-colors ${
                          currentThreadId === thread.id
                            ? "bg-pink-100 dark:bg-pink-900 border border-pink-300 dark:border-pink-700"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onThreadSelect(thread.id);
                            setIsOpen(false);
                          }}
                          className="w-full text-left"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 pr-8">
                              <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                {thread.title}
                              </p>
                              {thread.lastMessage && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                  {thread.lastMessage}
                                </p>
                              )}
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="text-xs text-gray-400">
                                  {new Date(
                                    thread.updatedAt
                                  ).toLocaleDateString("ja-JP")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                        {/* スレッド削除ボタン */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteThread(thread.id);
                          }}
                          disabled={deletingThreadId === thread.id}
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all rounded"
                          title="スレッドを削除"
                          aria-label="スレッドを削除"
                        >
                          {deletingThreadId === thread.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500" />
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <title>削除</title>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        まだ会話がありません
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        新しい会話を始めてみましょう
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 機能説明 */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                できること
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• 💬 チャット会話</li>
                <li>• 📷 画像のアップロードと分析</li>
                <li>• 🔄 新しい会話の開始</li>
                <li>• 💾 会話履歴の自動保存</li>
              </ul>
            </div>

            {/* ユーザー情報・認証 */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    {user.user_metadata?.avatar_url && (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="Profile"
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                        {user.user_metadata?.full_name || user.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    ログアウト
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ログインすると会話履歴が保存されます
                  </p>
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <title>Google</title>
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Googleでログイン</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* モバイル用オーバーレイ */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="メニューを閉じる"
        />
      )}
    </>
  );
};

export default ThreadSidebar;
