import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { createChatJsonResponse, mockFetchWithHandler, renderWithRouter } from "@/test/test-utils";

import { Home } from "../routes/index";
import { ChatLayout } from "./chat-layout";

describe("chat layout", () => {
  afterEach(() => {
    cleanup();
  });

  const chatList = [
    { id: "cht-1", title: "First chat", createdAt: "2026-01-01", updatedAt: "2026-01-02" },
    { id: "cht-2", title: "Second chat", createdAt: "2026-01-03", updatedAt: "2026-01-04" },
  ];

  it("renders a sidebar with chat list on desktop", async () => {
    const { restore } = mockFetchWithHandler((url) => {
      const urlString = typeof url === "string" ? url : url.toString();
      if (urlString.includes("/api/chats") && !urlString.includes("/api/chats/")) {
        return createChatJsonResponse(chatList);
      }
      return new Response("Not found", { status: 404 });
    });

    await renderWithRouter([
      {
        path: "/",
        component: () => (
          <ChatLayout>
            <Home />
          </ChatLayout>
        ),
      },
    ]);

    await waitFor(() => {
      expect(screen.getByText("New Chat")).toBeDefined();
      expect(screen.getByText("First chat")).toBeDefined();
    });

    restore();
  });

  it("navigates to a persisted Chat when clicking a chat link in the list", async () => {
    const { restore } = mockFetchWithHandler((url) => {
      const urlString = typeof url === "string" ? url : url.toString();
      if (urlString.includes("/api/chats") && !urlString.includes("/api/chats/")) {
        return createChatJsonResponse(chatList);
      }
      return new Response("Not found", { status: 404 });
    });

    const { router } = await renderWithRouter([
      {
        path: "/",
        component: () => (
          <ChatLayout>
            <Home />
          </ChatLayout>
        ),
      },
      { path: "/chats/$id", component: () => <div>Chat detail</div> },
    ]);

    await waitFor(() => {
      expect(screen.getByText("First chat")).toBeDefined();
    });

    fireEvent.click(screen.getByText("First chat"));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/chats/cht-1");
    });

    restore();
  });

  it("renders the new-chat composer at / without replacing it with a recent Chat", async () => {
    const { restore } = mockFetchWithHandler((url) => {
      const urlString = typeof url === "string" ? url : url.toString();
      if (urlString.includes("/api/chats") && !urlString.includes("/api/chats/")) {
        return createChatJsonResponse(chatList);
      }
      return new Response("Not found", { status: 404 });
    });

    const { router } = await renderWithRouter([
      {
        path: "/",
        component: () => (
          <ChatLayout>
            <Home />
          </ChatLayout>
        ),
      },
      { path: "/chats/$id", component: () => <div>Chat detail</div> },
    ]);

    await waitFor(() => {
      expect(screen.getByText("Ask your Agent anything...")).toBeDefined();
    });

    expect(router.state.location.pathname).toBe("/");

    restore();
  });
});
