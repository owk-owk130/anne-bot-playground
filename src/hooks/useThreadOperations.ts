"use client";

import { useState, useCallback } from "react";
import { useAuth } from "~/lib/auth/AuthProvider";

export const useThreadOperations = () => {
  const { user } = useAuth();
  const [isOperating, setIsOperating] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  // スレッドを作成または取得する関数
  const createOrUpdateThread = useCallback(
    async (threadId: string, title?: string) => {
      if (!user || !threadId) return false;

      setIsOperating(true);
      setOperationError(null);

      try {
        console.log(
          "💾 Creating/updating thread:",
          threadId,
          "with title:",
          title
        );

        const { createClientComponentClient } = await import(
          "~/lib/supabase/client"
        );
        const supabase = createClientComponentClient();

        // upsert操作でスレッドを作成または更新
        const { error: dbError } = await supabase.from("user_threads").upsert(
          {
            user_id: user.id,
            thread_id: threadId,
            title: title || "New Thread",
            updated_at: new Date().toISOString()
          },
          {
            onConflict: "user_id,thread_id"
          }
        );

        if (dbError) {
          console.error("Failed to create/update thread:", dbError);
          setOperationError("スレッドの作成に失敗しました");
          return false;
        }

        console.log("✅ Successfully created/updated thread:", threadId);
        return true;
      } catch (error) {
        console.error("Error creating/updating thread:", error);
        setOperationError("スレッドの作成中にエラーが発生しました");
        return false;
      } finally {
        setIsOperating(false);
      }
    },
    [user]
  );

  // スレッドのタイトルを更新する関数
  const updateThreadTitle = useCallback(
    async (threadId: string, title: string) => {
      if (!user || !threadId || !title) return false;

      setIsOperating(true);
      setOperationError(null);

      try {
        console.log("📝 Updating thread title:", threadId, "to:", title);

        const { createClientComponentClient } = await import(
          "~/lib/supabase/client"
        );
        const supabase = createClientComponentClient();

        const { error: dbError } = await supabase
          .from("user_threads")
          .update({
            title: title,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id)
          .eq("thread_id", threadId);

        if (dbError) {
          console.error("Failed to update thread title:", dbError);
          setOperationError("タイトルの更新に失敗しました");
          return false;
        }

        console.log("✅ Successfully updated thread title:", threadId);
        return true;
      } catch (error) {
        console.error("Error updating thread title:", error);
        setOperationError("タイトルの更新中にエラーが発生しました");
        return false;
      } finally {
        setIsOperating(false);
      }
    },
    [user]
  );

  // スレッドを削除する関数
  const deleteThread = useCallback(
    async (threadId: string) => {
      if (!user || !threadId) return false;

      setIsOperating(true);
      setOperationError(null);

      try {
        console.log("🗑️ Deleting thread:", threadId);

        // Supabaseからスレッドを削除
        const { createClientComponentClient } = await import(
          "~/lib/supabase/client"
        );
        const supabase = createClientComponentClient();

        const { error: dbError } = await supabase
          .from("user_threads")
          .delete()
          .eq("user_id", user.id)
          .eq("thread_id", threadId);

        if (dbError) {
          console.error("Failed to delete thread from database:", dbError);
          setOperationError("スレッドの削除に失敗しました");
          return false;
        }

        // Mastraメモリからも削除を試行
        try {
          const response = await fetch(
            `/api/chat?sessionId=${threadId}&userId=${user.id}`,
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json" }
            }
          );

          if (!response.ok) {
            console.warn(
              "Failed to delete thread from Mastra memory, but database deletion succeeded"
            );
          }
        } catch (error) {
          console.warn("Error deleting from Mastra memory:", error);
        }

        console.log("✅ Successfully deleted thread:", threadId);
        return true;
      } catch (error) {
        console.error("Error deleting thread:", error);
        setOperationError("スレッドの削除中にエラーが発生しました");
        return false;
      } finally {
        setIsOperating(false);
      }
    },
    [user]
  );

  return {
    isOperating,
    operationError,
    createOrUpdateThread,
    updateThreadTitle,
    deleteThread
  };
};
