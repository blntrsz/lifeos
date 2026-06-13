import { createFileRoute } from "@tanstack/react-router";

import { ChatComposer } from "@/chat/chat-composer";

export const Route = createFileRoute("/")({ component: Home });

export function Home() {
  return <ChatComposer />;
}
