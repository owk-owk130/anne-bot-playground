"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "~/lib/supabase/client";

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URLフラグメント（#以降）から認証情報を取得（Implicit Flow用）
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1),
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          console.log("Implicit Flow detected with tokens in URL fragment");

          // Implicit Flowの場合、手動でセッションを設定
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("Session set error:", error);
            router.push("/auth/auth-code-error?error=session_failed");
            return;
          }

          console.log("Session set successfully:", data.user?.email);
          router.push("/");
          return;
        }

        // URL検索パラメータを確認（Authorization Code Flow用）
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");

        if (error) {
          console.error("OAuth error in URL:", error);
          router.push(
            `/auth/auth-code-error?error=${encodeURIComponent(error)}`,
          );
          return;
        }

        if (code) {
          console.log("Authorization Code Flow detected, processing...");

          // コードをセッションに交換（クライアントサイドでも可能）
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("Code exchange error:", error.message);
            router.push("/auth/auth-code-error?error=exchange_failed");
            return;
          }

          console.log("Auth successful:", data.user?.email);
          router.push("/");
          return;
        }

        // どちらも該当しない場合はエラー
        console.log("No auth data found in URL");
        router.push("/auth/auth-code-error?error=no_auth_data");
      } catch (err) {
        console.error("Auth callback error:", err);
        router.push("/auth/auth-code-error?error=callback_exception");
      }
    };

    handleAuthCallback();
  }, [router, supabase.auth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">認証処理中...</p>
      </div>
    </div>
  );
}
