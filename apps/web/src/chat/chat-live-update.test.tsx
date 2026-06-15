import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ChatLayout } from "@/chat/chat-layout";
import {
  createChatJsonResponse,
  createSseResponse,
  mockFetchWithHandler,
  renderWithRouter,
  resolveUrl,
} from "@/test/test-utils";

import { Route as ChatRoute } from "../routes/chats.$id";
import { Home } from "../routes/index";

const ChatPage = ChatRoute.options.component!;

type Chat = {
  readonly id: string;
  readonly title: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

type HistoryItem = {
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly options: Record<string, never>;
};

let restoreFetch: (() => void) | null = null;

describe("chat live updates", () => {
  afterEach(() => {
    cleanup();
    restoreFetch?.();
    restoreFetch = null;
  });

  it("refreshes sidebar data after starting and continuing Chats", async () => {
    let firstChat: Chat = {
      id: "cht-1",
      title: "First chat",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };
    const secondChat: Chat = {
      id: "cht-2",
      title: "Second chat",
      createdAt: "2026-01-02",
      updatedAt: "2026-01-02",
    };
    const thirdChat: Chat = {
      id: "cht-3",
      title: "Third chat",
      createdAt: "2026-01-04",
      updatedAt: "2026-01-04",
    };

    let chats = [secondChat, firstChat];
    let firstHistory: Array<HistoryItem> = [
      { role: "user", content: "First chat", options: {} },
      { role: "assistant", content: "Agent received: First chat", options: {} },
    ];
    let thirdHistory: Array<HistoryItem> = [];

    const { restore } = mockFetchWithHandler((url) => {
      const urlString = resolveUrl(url);

      if (urlString.includes("/api/chats/cht-1/messages")) {
        firstChat = { ...firstChat, updatedAt: "2026-01-03" };
        chats = [firstChat, secondChat];
        firstHistory = [
          ...firstHistory,
          { role: "user", content: "Continue", options: {} },
          { role: "assistant", content: "Agent received: Continue", options: {} },
        ];
        return createSseResponse([
          { event: "chat", data: firstChat },
          { event: "delta", data: { text: "Agent received: Continue" } },
          { event: "done", data: { reason: "complete" } },
        ]);
      }

      if (urlString.includes("/api/chats/start-chat")) {
        chats = [thirdChat, ...chats];
        thirdHistory = [
          { role: "user", content: "Third chat", options: {} },
          { role: "assistant", content: "Agent received: Third chat", options: {} },
        ];
        return createSseResponse([
          { event: "chat", data: thirdChat },
          { event: "delta", data: { text: "Agent received: Third chat" } },
          { event: "done", data: { reason: "complete" } },
        ]);
      }

      const pathname = new URL(urlString, "http://localhost").pathname;
      if (pathname === "/api/chats") {
        return createChatJsonResponse(chats);
      }
      if (pathname === "/api/chats/cht-1") {
        return createChatJsonResponse({ ...firstChat, history: { content: firstHistory } });
      }
      if (pathname === "/api/chats/cht-3") {
        return createChatJsonResponse({ ...thirdChat, history: { content: thirdHistory } });
      }
      return new Response("Not found", { status: 404 });
    });
    restoreFetch = restore;

    const { router } = await renderWithRouter(
      [
        {
          path: "/",
          component: () => (
            <ChatLayout>
              <Home />
            </ChatLayout>
          ),
        },
        {
          path: "/chats/$id",
          component: () => (
            <ChatLayout>
              <ChatPage />
            </ChatLayout>
          ),
        },
      ],
      "/chats/cht-1",
    );

    await waitFor(() => {
      expect(screen.getByText("Agent received: First chat")).toBeDefined();
      expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
        "New Chat",
        "Second chat",
        "First chat",
      ]);
    });

    fireEvent.change(screen.getByPlaceholderText("What would you like to focus on?"), {
      target: { value: "Continue" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText("Agent received: Continue")).toBeDefined();
      expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
        "New Chat",
        "First chat",
        "Second chat",
      ]);
    });

    fireEvent.click(screen.getByRole("link", { name: "New Chat" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
      expect(screen.getByText("Ask your Agent anything...")).toBeDefined();
    });

    fireEvent.change(screen.getByPlaceholderText("What would you like to focus on?"), {
      target: { value: "Third chat" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/chats/cht-3");
      expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
        "New Chat",
        "Third chat",
        "First chat",
        "Second chat",
      ]);
    });
  });
});
