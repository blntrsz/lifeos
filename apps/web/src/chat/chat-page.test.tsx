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

  it("renders supported Effect AI Message parts in chat bubbles", async () => {
    const chatJson = createChatJsonResponse({
      id: "cht-parts",
      title: "Parts",
      createdAt: "2026-06-13T00:00:00.000Z",
      updatedAt: "2026-06-14T00:00:00.000Z",
      history: {
        content: [
          { role: "system", content: "System notice", options: {} },
          {
            role: "user",
            content: [
              { type: "text", text: "Please inspect this", options: {} },
              {
                type: "file",
                mediaType: "application/pdf",
                fileName: "plan.pdf",
                data: "data:application/pdf;base64,AA==",
                options: {},
              },
            ],
            options: {},
          },
          {
            role: "assistant",
            content: [
              { type: "reasoning", text: "Checking the file summary", options: {} },
              {
                type: "tool-call",
                id: "call-1",
                name: "search_notes",
                params: { query: "plan" },
                providerExecuted: false,
                options: {},
              },
              {
                type: "tool-result",
                id: "call-1",
                name: "search_notes",
                isFailure: false,
                result: { matches: 2 },
                options: {},
              },
              {
                type: "tool-approval-request",
                approvalId: "approval-1",
                toolCallId: "call-2",
                options: {},
              },
              { type: "text", text: "I found two related notes.", options: {} },
            ],
            options: {},
          },
          {
            role: "tool",
            content: [
              {
                type: "tool-approval-response",
                approvalId: "approval-1",
                approved: false,
                reason: "Not now",
                options: {},
              },
            ],
            options: {},
          },
        ],
      },
    });

    const { restore } = mockFetchWithHandler(() => chatJson);

    await renderWithRouter([{ path: "/chats/$id", component: ChatPage }], "/chats/cht-parts");

    await waitFor(() => {
      expect(screen.getByText("System notice")).toBeDefined();
      expect(screen.getByText("Please inspect this")).toBeDefined();
      expect(screen.getByText("File: plan.pdf (application/pdf)")).toBeDefined();
      expect(screen.getByText("Reasoning: Checking the file summary")).toBeDefined();
      expect(screen.getByText("Tool call: search_notes")).toBeDefined();
      expect(screen.getByText("Tool result: search_notes")).toBeDefined();
      expect(screen.getByText("Approval requested: call-2")).toBeDefined();
      expect(screen.getByText("I found two related notes.")).toBeDefined();
      expect(screen.getByText("Approval denied: Not now")).toBeDefined();
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
