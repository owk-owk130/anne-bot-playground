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
```

Google AI Studio (https://ai.google.dev/) でAPIキーを取得できます。

### 3. 開発サーバーの起動

```bash
bun run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

## プロジェクト構成

```
src/
├── app/
│   ├── page.tsx          # メインのチャットページ
│   └── api/
│       └── chat/
│           └── route.ts  # チャットAPI エンドポイント
└── mastra/
    ├── index.ts          # Mastra設定
    └── agents/
        └── index.ts      # アンのエージェント定義
```

## 技術スタック

- **フレームワーク**: Next.js 15.3.3 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **AIフレームワーク**: Mastra
- **LLMプロバイダー**: Google Gemini
- **パッケージマネージャー**: Bun
- **ランタイム**: Node.js

## 開発

### コードの品質

```bash
# Linting
bun run lint

# フォーマット
bun run format

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
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel Platform](https://vercel.com)
