export interface Thread {
  id: string;
  title: string;
  lastMessage?: string;
  messageCount?: number; // オプショナルに変更
  createdAt: string;
  updatedAt: string;
}

export interface ThreadsResponse {
  threads: Thread[];
  error?: string;
}
