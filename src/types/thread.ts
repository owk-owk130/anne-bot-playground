export interface Thread {
  id: string;
  title: string;
  lastMessage?: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadsResponse {
  threads: Thread[];
  error?: string;
}
