import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  createChatJsonResponse,
  createSseResponse,
  mockDesktopPointer,
  mockFetchWithHandler,
  renderWithRouter,
  resolveUrl,
  restoreDesktopPointer,
} from "@/test/test-utils";

import { Route as ChatRoute } from "../routes/chats.$id";

const ChatPage = ChatRoute.options.component!;

const makeChatJson = () =>
  createChatJsonResponse({
    id: "cht-test",
    title: "Hello",
    createdAt: "2026-06-13T00:00:00.000Z",
    updatedAt: "2026-06-13T00:00:00.000Z",
    history: {
      content: [
        { role: "user", content: "Hello", options: {} },
        { role: "assistant", content: "Agent received: Hello", options: {} },
      ],
    },
  });

const getComposer = () => screen.getAllByPlaceholderText("What would you like to focus on?")[0];

describe("chat detail page", () => {
  afterEach(() => {
    cleanup();
    restoreDesktopPointer();
  });

  it("loads persisted chat and displays history", async () => {
    const { fetchMock, restore } = mockFetchWithHandler(() => makeChatJson());

    await renderWithRouter([{ path: "/chats/$id", component: ChatPage }], "/chats/cht-test");

    await waitFor(() => {
      expect(screen.getByText("Hello")).toBeDefined();
      expect(screen.getByText("Agent received: Hello")).toBeDefined();
    });

    expect(fetchMock).toHaveBeenCalled();
    const url = resolveUrl(fetchMock.mock.calls[0]![0] as string | URL | Request);
    expect(url).toContain("/api/chats/cht-test");

    restore();
  });

  it("continues a chat by sending another message", async () => {
    mockDesktopPointer();
    const { restore } = mockFetchWithHandler((url) => {
      const urlString = resolveUrl(url);
      if (urlString.includes("/api/chats/cht-test/messages")) {
        return createSseResponse([
          {
            event: "chat",
            data: {
              id: "cht-test",
              title: "Hello",
              createdAt: "2026-06-13T00:00:00.000Z",
              updatedAt: "2026-06-14T00:00:00.000Z",
            },
          },
          { event: "delta", data: { text: "Agent received: Continue" } },
          { event: "done", data: { reason: "complete" } },
        ]);
      }
      return makeChatJson();
    });

    await renderWithRouter([{ path: "/chats/$id", component: ChatPage }], "/chats/cht-test");

    await waitFor(() => {
      expect(screen.getByText("Hello")).toBeDefined();
    });

    const textarea = getComposer();
    fireEvent.change(textarea, { target: { value: "Continue" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    await waitFor(
      () => {
        expect(screen.getByText("Agent received: Continue")).toBeDefined();
      },
      { timeout: 3000 },
    );

    restore();
    restoreDesktopPointer();
  });

  it("shows error state for a missing chat", async () => {
    const { restore } = mockFetchWithHandler(() => new Response("Not found", { status: 404 }));

    await renderWithRouter([{ path: "/chats/$id", component: ChatPage }], "/chats/cht-missing");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
    });

    restore();
  });

  it("does not show edit or retry controls in chat page", async () => {
    const { restore } = mockFetchWithHandler(() => makeChatJson());

    await renderWithRouter([{ path: "/chats/$id", component: ChatPage }], "/chats/cht-test");

    await waitFor(() => {
      expect(screen.getByText("Hello")).toBeDefined();
    });

    expect(screen.queryByText(/edit/i)).toBeNull();
    expect(screen.queryByText(/retry/i)).toBeNull();
    expect(screen.queryByText(/regenerate/i)).toBeNull();

    restore();
  });

  it("displays persisted history after reload by showing all saved turns", async () => {
    const chatJson = createChatJsonResponse({
      id: "cht-multi",
      title: "Multi-turn",
      createdAt: "2026-06-13T00:00:00.000Z",
      updatedAt: "2026-06-14T00:00:00.000Z",
      history: {
        content: [
          { role: "user", content: "First message", options: {} },
          { role: "assistant", content: "Agent received: First message", options: {} },
          { role: "user", content: "Second message", options: {} },
          { role: "assistant", content: "Agent received: Second message", options: {} },
        ],
      },
    });

    const { restore } = mockFetchWithHandler(() => chatJson);

    await renderWithRouter([{ path: "/chats/$id", component: ChatPage }], "/chats/cht-multi");

    await waitFor(() => {
      expect(screen.getByText("First message")).toBeDefined();
      expect(screen.getByText("Agent received: First message")).toBeDefined();
      expect(screen.getByText("Second message")).toBeDefined();
      expect(screen.getByText("Agent received: Second message")).toBeDefined();
    });

    restore();
  });

  it("does not send an empty message from the continue composer", async () => {
    mockDesktopPointer();
    const { fetchMock, restore } = mockFetchWithHandler((url) => {
      const urlString = resolveUrl(url);
      if (urlString.includes("/messages")) {
        return new Response("", { status: 400 });
      }
      return makeChatJson();
    });

    await renderWithRouter([{ path: "/chats/$id", component: ChatPage }], "/chats/cht-test");

    await waitFor(() => {
      expect(screen.getByText("Hello")).toBeDefined();
    });

    const sendButton = screen.getByRole("button", { name: /send/i });
    expect(sendButton.getAttribute("disabled")).not.toBeNull();

    const textarea = getComposer();
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    await new Promise((resolve) => setTimeout(resolve, 100));
    const postCalls = fetchMock.mock.calls.filter(
      ([url]) => typeof url === "string" && url.includes("/messages"),
    );
    expect(postCalls.length).toBe(0);

    restore();
    restoreDesktopPointer();
  });
});
