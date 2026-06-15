import { useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";

import * as ChatAtoms from "@/chat/chat.atoms";

export function ChatList() {
  const result = useAtomValue(ChatAtoms.chatList);
  const isWaiting = !AsyncResult.isInitial(result) && result.waiting;
  const chats = AsyncResult.isSuccess(result) ? result.value : [];

  return (
    <nav className="flex flex-col gap-1 p-2">
      <Link
        to="/"
        className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
      >
        New Chat
      </Link>

      {isWaiting && <span className="px-3 py-2 text-sm text-muted-foreground">Loading...</span>}

      {chats.map((chat) => (
        <Link
          key={chat.id}
          to="/chats/$id"
          params={{ id: chat.id }}
          className="truncate rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          {chat.title}
        </Link>
      ))}
    </nav>
  );
}
