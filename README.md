# Anne Bot 🐱

「アン」という名前の子猫のチャットボットです。ツンデレな性格で、語尾に「にゃん」や「だにゃ」をつけて話します。  
アンはまだ簡単なお話しかできないけど、これからどんどんできることが増えていくから楽しみにしててにゃ。  
DEMO: [https://anne-bot.vercel.app/](https://anne-bot.vercel.app/)

## セットアップ

### 1. 依存関係のインストール

```bash
bun install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```bash
# Google AI API
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key

# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_DB_HOST=your_supabase_host
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=your_supabase_user
SUPABASE_DB_PASSWORD=your_supabase_password
```

**取得方法:**

- Google AI Studio (https://ai.google.dev/) でAPIキーを取得
- Supabase (https://supabase.com/) でプロジェクト作成後、設定画面から各種キーを取得

### 3. データベースセットアップ

Supabaseプロジェクトで以下のテーブルを作成してください：

```sql
-- ユーザーのスレッド管理
CREATE TABLE user_threads (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  thread_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, thread_id)
);

-- インデックス作成
CREATE INDEX idx_user_threads_user_id ON user_threads(user_id);
CREATE INDEX idx_user_threads_updated_at ON user_threads(updated_at DESC);
```

### 4. 開発サーバーの起動

```bash
bun run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

## プロジェクト構成

```text
src/
├── app/
│   ├── page.tsx              # メインのチャットページ
│   ├── layout.tsx            # アプリ全体のレイアウト
│   ├── globals.css           # グローバルCSS
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts      # チャットAPI エンドポイント
│   │   └── threads/
│   │       └── route.ts      # スレッド管理API
│   └── auth/
│       ├── callback/
│       │   └── page.tsx      # 認証コールバック
│       └── auth-code-error/
│           └── page.tsx      # 認証エラーページ
├── components/
│   └── 共通コンポーネント
├── lib/
│   ├── # 汎用ライブラリ
├── mastra/
    ├── index.ts          # Mastra設定
    ├── agents/
    │   └── index.ts      # エージェント定義
    ├── tools/
    │   └── *.ts          # Mastra関連ツール
    └── workflows/
        └── index.ts      # ワークフロー定義
└── types/
    └──  # TypeScript型定義
```

## 技術構成

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **ランタイム**: Node.js
- **パッケージマネージャー**: Bun
- **スタイリング**: Tailwind CSS v4
- **AIフレームワーク**: Mastra
- **LLMプロバイダー**: Google Gemini (gemini-1.5-flash)
- **認証**: Supabase Auth (Google OAuth)
- **データベース**: Supabase (PostgreSQL)
- **状態管理**: AI SDK React hooks
- **Linter/Formatter**: Biome
- **テストフレームワーク**: Vitest
- **デプロイ**: Vercel

## 開発

### 開発用コマンド

```bash
# 開発サーバー起動（Turbopack使用）
bun run dev

# プロダクションビルド
bun run build

# プロダクションサーバー起動
bun run start

# Linting
bun run lint

# Linting + 自動修正
bun run lint:fix

# フォーマット
bun run format

# フォーマット + 自動修正
bun run format:fix

# テスト実行
bun run test
```

## API エンドポイント

### `/api/chat`

- **GET**: 会話履歴の取得
- **POST**: メッセージ送信・画像分析
- **DELETE**: 会話履歴の削除

### `/api/threads`

- **GET**: ユーザーのスレッド一覧取得
- **DELETE**: 特定スレッドの削除

## 関連リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Mastra Documentation](https://mastra.ai/docs)
- [Google AI Studio](https://ai.google.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [Biome](https://biomejs.dev/)
- [Vitest](https://vitest.dev/)
- [Bun](https://bun.sh/)
- [Vercel Platform](https://vercel.com)
