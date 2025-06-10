import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Supabase URLまたはサービスロールキーが環境変数に設定されていません"
  );
}
const supabase = createClient(supabaseUrl, supabaseKey);

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return new Response(JSON.stringify({ threads: [] }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const { data, error } = await supabase
    .from("user_threads")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) {
    return new Response(JSON.stringify({ threads: [], error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({ threads: data }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

export const DELETE = async (req: Request) => {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const threadId = url.searchParams.get("threadId");
  if (!userId || !threadId) {
    return new Response(JSON.stringify({ error: "Missing params" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const { error } = await supabase
    .from("user_threads")
    .delete()
    .eq("user_id", userId)
    .eq("thread_id", threadId);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};
