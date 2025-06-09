"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "~/lib/auth/AuthProvider";
import type { Thread } from "~/types/thread";

interface UserThread {
  id: string;
  user_id: string;
  thread_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export const useThreads = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // スレッド一覧を取得する関数
  const fetchThreads = useCallback(async () => {
    if (!user) {
      setThreads([]);
      return;
    }

    setIsLoadingThreads(true);
    setError(null);

    try {
      console.log("🔍 Fetching threads for user:", user.id);

      // クライアントサイドでSupabaseから直接取得
      const { createClientComponentClient } = await import(
        "~/lib/supabase/client"
      );
      const supabase = createClientComponentClient();

      const { data: userThreads, error: dbError } = await supabase
        .from("user_threads")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (dbError) {
        console.error("Database error:", dbError);
        setError("データベースエラーが発生しました");
        setThreads([]);
        return;
      }

      // スレッド詳細情報を準備（Mastraからメッセージ情報を取得）
      const threadsWithDetails = await Promise.all(
        (userThreads || []).map(async (userThread: UserThread) => {
          let messageCount = 0;
          let lastMessage = undefined;

          try {
            // Mastraからメッセージを取得してメッセージ数を計算
            const response = await fetch(
              `/api/chat?sessionId=${userThread.thread_id}&userId=${user.id}`,
              {
                method: "GET",
                headers: { "Content-Type": "application/json" }
              }
            );

            if (response.ok) {
              const data = await response.json();
              console.log(
                `Thread ${userThread.thread_id} messages:`,
                data.messages
              );
              if (Array.isArray(data.messages) && data.messages.length > 0) {
                messageCount = data.messages.length;
                // 最後のメッセージを取得（ユーザーまたはアシスタントの最新メッセージ）
                const lastMsg = data.messages[data.messages.length - 1];
                if (lastMsg) {
                  const content =
                    typeof lastMsg.content === "string"
                      ? lastMsg.content
                      : JSON.stringify(lastMsg.content);
                  lastMessage =
                    content.length > 50
                      ? `${content.substring(0, 50)}...`
                      : content;
                }
              } else {
                console.log(
                  `No messages found for thread ${userThread.thread_id}`
                );
              }
            } else {
              console.warn(
                `Failed to fetch messages for thread ${userThread.thread_id}, status:`,
                response.status
              );
            }
          } catch (error) {
            console.warn(
              `Failed to fetch messages for thread ${userThread.thread_id}:`,
              error
            );
          }

          return {
            id: userThread.thread_id,
            title: userThread.title || "New Thread",
            lastMessage: lastMessage || "メッセージがありません",
            createdAt: userThread.created_at,
            updatedAt: userThread.updated_at,
            messageCount: messageCount
          };
        })
      );

      setThreads(threadsWithDetails);
      console.log(
        "✅ Successfully fetched threads:",
        threadsWithDetails.length
      );
    } catch (error) {
      console.error("Error fetching threads:", error);
      setError("スレッドの取得中にエラーが発生しました");
      setThreads([]);
    } finally {
      setIsLoadingThreads(false);
    }
  }, [user]);

  // 最後のスレッドを取得する関数
  const getLastThread = useCallback(async () => {
    if (!user) return null;

    try {
      console.log("🔍 Fetching last thread for user:", user.id);

      const { createClientComponentClient } = await import(
        "~/lib/supabase/client"
      );
      const supabase = createClientComponentClient();

      const { data: lastThread, error: dbError } = await supabase
        .from("user_threads")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (dbError) {
        if (dbError.code === "PGRST116") {
          // No rows found
          console.log("📭 No threads found for user");
          return null;
        }
        console.error("Database error:", dbError);
        return null;
      }

      console.log("✅ Found last thread:", lastThread.thread_id);
      return lastThread.thread_id;
    } catch (error) {
      console.error("Error fetching last thread:", error);
      return null;
    }
  }, [user]);

  // スレッド一覧をクリアする関数
  const clearThreads = useCallback(() => {
    setThreads([]);
    setError(null);
  }, []);

  return {
    threads,
    isLoadingThreads,
    error,
    fetchThreads,
    clearThreads,
    getLastThread
  };
};
