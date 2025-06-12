"use client";

import { useEffect, useState } from "react";
import { useAuth } from "~/lib/auth/AuthProvider";

/**
 * セッションIDの生成・管理を行うフック
 */
export const useSessionId = () => {
  const { user, loading } = useAuth();

  // 初期セッションIDを生成する関数
  const generateInitialSessionId = () => {
    if (typeof window === "undefined") return "";

    // ローカルストレージから既存のゲストセッションIDを取得
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

  // セッションID初期化
  useEffect(() => {
    const initializeSessionId = () => {
      if (loading) return;

      if (typeof window === "undefined") return;

      if (!user) {
        // ゲストユーザー用セッションID
        let guestSessionId = localStorage.getItem("guest_sessionId");
        if (!guestSessionId) {
          guestSessionId = `guest-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          localStorage.setItem("guest_sessionId", guestSessionId);
        }
        setSessionId(guestSessionId);
        return;
      }

      // 認証済みユーザー用セッションID
      const userSessionKey = `sessionId_${user.id}`;
      let storedSessionId = localStorage.getItem(userSessionKey);

      if (!storedSessionId) {
        storedSessionId = `session-${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem(userSessionKey, storedSessionId);
      }

      setSessionId(storedSessionId);
    };

    initializeSessionId();
  }, [loading, user]);

  // 新しいセッションIDを生成・設定
  const generateNewSessionId = () => {
    if (!user) {
      // ゲストユーザー用
      const newGuestSessionId = `guest-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      if (typeof window !== "undefined") {
        localStorage.setItem("guest_sessionId", newGuestSessionId);
      }
      setSessionId(newGuestSessionId);
      return newGuestSessionId;
    }

    // 認証済みユーザー用
    const newSessionId = `session-${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    if (typeof window !== "undefined") {
      const userSessionKey = `sessionId_${user.id}`;
      localStorage.setItem(userSessionKey, newSessionId);
    }
    setSessionId(newSessionId);
    return newSessionId;
  };

  // セッションIDを更新
  const updateSessionId = (threadId: string) => {
    if (typeof window !== "undefined") {
      if (!user) {
        localStorage.setItem("guest_sessionId", threadId);
      } else {
        const userSessionKey = `sessionId_${user.id}`;
        localStorage.setItem(userSessionKey, threadId);
      }
    }
    setSessionId(threadId);
  };

  return {
    sessionId,
    generateNewSessionId,
    updateSessionId
  };
};
