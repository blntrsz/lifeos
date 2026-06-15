import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import * as ChatAtoms from "@/chat/chat.atoms";
import { Button } from "@/components/ui/button";

export function ChatList() {
  const result = useAtomValue(ChatAtoms.chatList);
  const refresh = useAtomRefresh(ChatAtoms.chatList);
  const deleteResult = useAtomValue(ChatAtoms.deleteChat);
  const remove = useAtomSet(ChatAtoms.deleteChat, { mode: "promise" });
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isWaiting = !AsyncResult.isInitial(result) && result.waiting;
  const isDeleting = !AsyncResult.isInitial(deleteResult) && deleteResult.waiting;
  const chats = AsyncResult.isSuccess(result) ? result.value : [];
  const [chatToDelete, setChatToDelete] = useState<(typeof chats)[number] | null>(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
        <div key={chat.id} className="group flex items-center gap-1 rounded-lg hover:bg-muted">
          <Link
            to="/chats/$id"
            params={{ id: chat.id }}
            className="min-w-0 flex-1 truncate px-3 py-2 text-sm font-medium text-foreground"
          >
            {chat.title}
          </Link>
          <button
            type="button"
            className="mr-1 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-50"
            aria-label={`Delete ${chat.title}`}
            disabled={isDeleting}
            onClick={() => setChatToDelete(chat)}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}

      {chatToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-chat-title"
            className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-lg"
          >
            <h2 id="delete-chat-title" className="text-lg font-semibold text-foreground">
              Delete Chat
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete {chatToDelete.title}? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => setChatToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting}
                onClick={() => {
                  const chat = chatToDelete;
                  void remove(chat.id)
                    .then(() => {
                      setChatToDelete(null);
                      if (pathname === `/chats/${chat.id}`) {
                        void navigate({ to: "/" });
                      }
                    })
                    .catch(() => undefined);
                }}
              >
                Delete Chat
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
