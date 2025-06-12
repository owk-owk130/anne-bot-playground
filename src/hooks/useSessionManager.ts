"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Message } from "ai";
import { useAuth } from "~/lib/auth/AuthProvider";

interface Props {
  setMessages: (messages: Message[]) => void;
  reload?: () => void;
}

export const useSessionManager = ({ setMessages, reload }: Props) => {
  const { user, loading } = useAuth();

  // 初期セッションIDを生成する関数
  const generateInitialSessionId = () => {
    if (typeof window === "undefined") return "";

    // ローカルストレージから既存のゲストセッションIDを取得を試行
    const existingGuestSessionId = localStorage.getItem("guest_sessionId");
    if (existingGuestSessionId) {
      return existingGuestSessionId;
    }

    // 新しいゲストセッションIDを生成
    const newGuestSessionId = `guest-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("guest_sessionId", newGuestSessionId);
    return newGuestSessionId;
  };

  const [sessionId, setSessionId] = useState<string>(generateInitialSessionId);
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

  // セッション初期化
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
            const messages = await fetchChatHistory(targetSessionId, user.id);
            setMessages(messages);
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
  }, [loading, user, setMessages, fetchChatHistory]);

  // 新しいスレッド作成
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

    if (reload) {
      setTimeout(() => {
        reload();
      }, 100);
    }
  }, [user, setMessages, reload]);

  // スレッド選択
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
        const messages = await fetchChatHistory(threadId, user.id);
        setMessages(messages);

        hasLoadedHistoryRef.current = true;
      } catch {
        setMessages([]);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [user, setMessages, fetchChatHistory]
  );

  return {
    sessionId,
    isLoadingHistory,
    handleNewThread,
    handleThreadSelect
  };
};
