import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// グローバルなシングルトンキー
const SUPABASE_CLIENT_KEY = "__anne_bot_supabase_client__";

// Windowオブジェクトの型拡張
declare global {
  interface Window {
    [SUPABASE_CLIENT_KEY]?: SupabaseClient;
    __anne_bot_reset_supabase?: () => void;
  }
}

// ブラウザ環境でのシングルトンインスタンス管理
const getGlobalSupabaseClient = () => {
  if (typeof window === "undefined") {
    // サーバーサイドでは常に新しいインスタンスを作成
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: "anne-bot-auth",
        autoRefreshToken: false, // サーバーサイドではリフレッシュ無効
        persistSession: false // サーバーサイドでは永続化無効
      }
    });
  }

  // ブラウザ環境では厳密なシングルトンパターンを実装
  if (!window[SUPABASE_CLIENT_KEY]) {
    window[SUPABASE_CLIENT_KEY] = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: "anne-bot-auth",
        autoRefreshToken: true,
        persistSession: true,
        debug: false
      }
    });

    if (process.env.NODE_ENV === "development") {
      console.log("🔧 Supabase client created (singleton)");
    }
  }

  return window[SUPABASE_CLIENT_KEY];
};

export const createClientComponentClient = () => {
  return getGlobalSupabaseClient();
};

// ホットリロード対応のクリーンアップ
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  window.__anne_bot_reset_supabase = () => {
    delete window[SUPABASE_CLIENT_KEY];
    console.log("🔄 Supabase client reset for hot reload");
  };
}
