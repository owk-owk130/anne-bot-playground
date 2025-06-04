# Anne　Bot 🐱

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
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
SUPABASE_DB_HOST=your_supabase_host
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=your_supabase_user
SUPABASE_DB_PASSWORD=your_supabase_password
```

- Google AI Studio (https://ai.google.dev/) でAPIキーを取得できます
- Supabase (https://supabase.com/) でデータベース情報を取得できます

### 3. 開発サーバーの起動

```bash
bun run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

## プロジェクト構成

```text
src/
├── app/
│   ├── page.tsx          # メインのチャットページ
│   ├── layout.tsx        # アプリ全体のレイアウト
│   ├── globals.css       # グローバルCSS
│   └── api/
│       └── chat/
│           └── route.ts  # チャットAPI エンドポイント
└── mastra/
    ├── index.ts          # Mastra設定
    ├── agents/
    │   └── index.ts      # アンのエージェント定義
    ├── tools/
    │   └── *.ts          # Mastra関連ツール
    └── workflows/
        └── index.ts      # ワークフロー定義
```

## 技術構成

- **フレームワーク**: Next.js (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **AIフレームワーク**: Mastra
- **LLMプロバイダー**: Google Gemini
- **データベース**: Supabase (PostgreSQL)
- **パッケージマネージャー**: Bun
- **Linter/Formatter**: Biome
- **テストフレームワーク**: Vitest
- **ランタイム**: Node.js

## 開発

### lint / format / test

```bash
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

### ビルド

```bash
bun run build
```

## 関連リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Mastra Documentation](https://mastra.ai/docs)
- [Google AI Studio](https://ai.google.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [Biome](https://biomejs.dev/)
- [Vitest](https://vitest.dev/)
- [Vercel Platform](https://vercel.com)
