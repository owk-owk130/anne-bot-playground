# Cat Bot MCP 🐱

「アン」という名前の子猫のチャットボットです。ツンデレな性格で、語尾に「にゃん」や「だにゃ」をつけて話します。

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

## デプロイ

### Vercel でのデプロイ

最も簡単な方法は [Vercel Platform](https://vercel.com/new) を使用することです：

1. GitHubリポジトリにプッシュ
2. Vercelでプロジェクトをインポート
3. 環境変数 `GOOGLE_GENERATIVE_AI_API_KEY` を設定
4. デプロイ完了！

詳細は [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) を参照してください。

## 関連リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Mastra Documentation](https://mastra.ai/docs)
- [Google AI Studio](https://ai.google.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
