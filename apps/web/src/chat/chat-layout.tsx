import { Menu, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { ChatList } from "@/chat/chat-list";

type ChatLayoutProps = {
  readonly children: ReactNode;
};

export function ChatLayout({ children }: ChatLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="font-semibold text-foreground">Agent</span>
        </div>
        <ChatList />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-2 border-b border-border px-4 py-3 md:hidden">
          <button
            type="button"
            className="rounded-lg p-1 hover:bg-muted"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
          <span className="font-semibold text-foreground">Agent</span>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
              role="presentation"
            />
            <aside className="absolute left-0 top-0 z-10 flex h-full w-64 flex-col bg-background shadow-lg">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="font-semibold text-foreground">Agent</span>
                <button
                  type="button"
                  className="rounded-lg p-1 hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation"
                >
                  <X className="size-5" />
                </button>
              </div>
              <ChatList />
            </aside>
          </div>
        )}

        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
