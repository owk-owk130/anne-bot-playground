"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Message } from "ai";
import { useAuth } from "~/lib/auth/AuthProvider";

interface Props {
  sessionId: string;
  setMessages: (messages: Message[]) => void;
  reload?: () => void;
  onSessionIdChange: (sessionId: string) => void;
}

/**
 * スレッド操作・履歴取得を行うフック
 */
export const useThreadManager = ({
  sessionId,
  setMessages,
  reload,
  onSessionIdChange
}: Props) => {
  const { user, loading } = useAuth();

  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const hasLoadedHistoryRef = useRef(false);

  // チャット履歴を取得するfetch関数
  const fetchChatHistory = useCallback(
    async (sessionId: string, userId: string): Promise<Message[]> => {
      try {
        const response = await fetch(
          `/api/chat?sessionId=${sessionId}&userId=${userId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" }
          }
        );

        if (response.ok) {
          const data = await response.json();
          return Array.isArray(data.messages) ? data.messages : [];
        }
        return [];
      } catch {
        return [];
      }
    },
    []
  );

  // スレッドを作成するfetch関数
  const createThreadApi = useCallback(
    async (userId: string, threadId: string, title = "New Thread") => {
      try {
        const response = await fetch("/api/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, threadId, title })
        });
        return response.ok;
      } catch {
        return false;
      }
    },
    []
  );

  // 初期履歴ロード
  useEffect(() => {
    const loadInitialHistory = async () => {
      if (loading || !sessionId) return;

      if (!user) {
        // ゲストユーザーは履歴なし
        setMessages([]);
        setIsLoadingHistory(false);
        hasLoadedHistoryRef.current = true;
        return;
      }

      if (!hasLoadedHistoryRef.current) {
        setIsLoadingHistory(true);
        try {
          const messages = await fetchChatHistory(sessionId, user.id);
          setMessages(messages);
        } catch {
          setMessages([]);
        } finally {
          setIsLoadingHistory(false);
          hasLoadedHistoryRef.current = true;
        }
      }
    };

    loadInitialHistory();
  }, [loading, user, sessionId, setMessages, fetchChatHistory]);

  // 新しいスレッド作成
  const handleNewThread = useCallback(async () => {
    // 新しいセッションIDを生成
    const newSessionId = !user
      ? `guest-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      : `session-${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // 認証済みユーザーの場合はAPIでスレッド情報を保存
    if (user) {
      const createResult = await createThreadApi(
        user.id,
        newSessionId,
        "New Thread"
      );
      if (!createResult) {
        console.error("Failed to create thread");
      }
    }

    // セッションIDを更新
    onSessionIdChange(newSessionId);
    setMessages([]);
    hasLoadedHistoryRef.current = true;

    if (reload) {
      setTimeout(() => {
        reload();
      }, 100);
    }
  }, [user, setMessages, reload, onSessionIdChange, createThreadApi]);

  // スレッド選択
  const handleThreadSelect = useCallback(
    async (threadId: string) => {
      if (!user) return;

      setIsLoadingHistory(true);
      try {
        onSessionIdChange(threadId);
        const messages = await fetchChatHistory(threadId, user.id);
        setMessages(messages);
        hasLoadedHistoryRef.current = true;
      } catch {
        setMessages([]);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [user, setMessages, fetchChatHistory, onSessionIdChange]
  );

  return {
    sessionId,
    isLoadingHistory,
    handleNewThread,
    handleThreadSelect
  };
};
