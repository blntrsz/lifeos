import { cleanup, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { createChatJsonResponse, mockFetchWithHandler, renderWithRouter } from "@/test/test-utils";

import { ChatList } from "./chat-list";

describe("chat list", () => {
  afterEach(() => {
    cleanup();
  });

  const chats = [
    { id: "cht-1", title: "First chat", createdAt: "2026-01-01", updatedAt: "2026-01-02" },
    { id: "cht-2", title: "Second chat", createdAt: "2026-01-03", updatedAt: "2026-01-04" },
  ];

  it("renders persisted chat titles from the backend", async () => {
    const { restore } = mockFetchWithHandler((url) => {
      const urlString = typeof url === "string" ? url : url.toString();
      if (urlString.includes("/api/chats") && !urlString.includes("/api/chats/")) {
        return createChatJsonResponse(chats);
      }
      return new Response("Not found", { status: 404 });
    });

    await renderWithRouter([
      { path: "/", component: ChatList },
      { path: "/chats/$id", component: () => <div>Stub</div> },
    ]);

    await waitFor(() => {
      expect(screen.getByText("First chat")).toBeDefined();
      expect(screen.getByText("Second chat")).toBeDefined();
    });

    restore();
  });

  it("includes a New Chat link to /", async () => {
    const { restore } = mockFetchWithHandler((url) => {
      const urlString = typeof url === "string" ? url : url.toString();
      if (urlString.includes("/api/chats") && !urlString.includes("/api/chats/")) {
        return createChatJsonResponse(chats);
      }
      return new Response("Not found", { status: 404 });
    });

    await renderWithRouter([
      { path: "/", component: ChatList },
      { path: "/chats/$id", component: () => <div>Stub</div> },
    ]);

    await waitFor(() => {
      expect(screen.getByText("New Chat")).toBeDefined();
    });

    const newChatLink = screen.getByText("New Chat");
    expect(newChatLink.getAttribute("href")).toBe("/");

    restore();
  });

  it("does not expose the dormant Task slice as a navigation target", async () => {
    const { restore } = mockFetchWithHandler((url) => {
      const urlString = typeof url === "string" ? url : url.toString();
      if (urlString.includes("/api/chats") && !urlString.includes("/api/chats/")) {
        return createChatJsonResponse(chats);
      }
      return new Response("Not found", { status: 404 });
    });

    await renderWithRouter([
      { path: "/", component: ChatList },
      { path: "/chats/$id", component: () => <div>Stub</div> },
    ]);

    await waitFor(() => {
      expect(screen.getByText("New Chat")).toBeDefined();
    });

    expect(screen.queryByText("Tasks")).toBeNull();
    expect(screen.queryByText(/task/i)).toBeNull();

    restore();
  });
});
