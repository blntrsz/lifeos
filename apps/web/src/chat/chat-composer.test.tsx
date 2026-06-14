import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  createSseResponse,
  mockDesktopPointer,
  mockFetch,
  renderWithRouter,
  restoreDesktopPointer,
} from "@/test/test-utils";

import { Home } from "../routes/index";

const getComposer = () => screen.getAllByPlaceholderText("What would you like to focus on?")[0];

describe("root chat route", () => {
  afterEach(() => {
    cleanup();
    restoreDesktopPointer();
  });
  it("renders the Agent label and a composer", async () => {
    await renderWithRouter([{ path: "/", component: Home }]);

    expect(screen.getByText("Agent")).toBeDefined();
    expect(getComposer()).toBeDefined();
  });

  it("sends the first message when the user presses Enter on desktop", async () => {
    mockDesktopPointer();
    const { fetchMock, restore } = mockFetch(
      createSseResponse([
        {
          event: "chat",
          data: {
            id: "cht-test",
            title: "Hello",
            createdAt: "2026-06-13T00:00:00.000Z",
            updatedAt: "2026-06-13T00:00:00.000Z",
          },
        },
        { event: "delta", data: { text: "Agent received: Hello" } },
        { event: "done", data: { reason: "complete" } },
      ]),
    );

    await renderWithRouter([
      { path: "/", component: Home },
      { path: "/chats/$id", component: () => <div>Chat</div> },
    ]);

    const textarea = getComposer();
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const [url, options] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.pathname).toBe("/api/chats/start-chat");
    expect(options.method).toBe("POST");
    expect(new TextDecoder().decode(options.body as Uint8Array)).toBe(
      JSON.stringify({ message: { text: "Hello" } }),
    );

    restore();
  });

  it("displays the streamed Agent response", async () => {
    mockDesktopPointer();
    const { restore } = mockFetch(
      createSseResponse([
        {
          event: "chat",
          data: {
            id: "cht-test",
            title: "Hello",
            createdAt: "2026-06-13T00:00:00.000Z",
            updatedAt: "2026-06-13T00:00:00.000Z",
          },
        },
        { event: "delta", data: { text: "Agent received: Hello" } },
        { event: "done", data: { reason: "complete" } },
      ]),
    );

    await renderWithRouter([
      { path: "/", component: Home },
      { path: "/chats/$id", component: () => <div>Chat</div> },
    ]);

    const textarea = getComposer();
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(screen.getByText("Agent received: Hello")).toBeDefined();
    });

    restore();
  });

  it("navigates to the created Chat URL after the stream completes", async () => {
    mockDesktopPointer();
    const { restore } = mockFetch(
      createSseResponse([
        {
          event: "chat",
          data: {
            id: "cht-test",
            title: "Hello",
            createdAt: "2026-06-13T00:00:00.000Z",
            updatedAt: "2026-06-13T00:00:00.000Z",
          },
        },
        { event: "delta", data: { text: "Agent received: Hello" } },
        { event: "done", data: { reason: "complete" } },
      ]),
    );

    function ChatStub() {
      return <div>Chat stub</div>;
    }

    const { router } = await renderWithRouter([
      { path: "/", component: Home },
      { path: "/chats/$id", component: ChatStub },
    ]);

    const textarea = getComposer();
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/chats/cht-test");
    });

    restore();
  });

  it("shows a fresh empty composer when the user returns to root", async () => {
    mockDesktopPointer();
    const { restore } = mockFetch(
      createSseResponse([
        {
          event: "chat",
          data: {
            id: "cht-test",
            title: "Hello",
            createdAt: "2026-06-13T00:00:00.000Z",
            updatedAt: "2026-06-13T00:00:00.000Z",
          },
        },
        { event: "delta", data: { text: "Agent received: Hello" } },
        { event: "done", data: { reason: "complete" } },
      ]),
    );

    function ChatStub() {
      return <div>Chat stub</div>;
    }

    const { router } = await renderWithRouter([
      { path: "/", component: Home },
      { path: "/chats/$id", component: ChatStub },
    ]);

    const textarea = getComposer();
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/chats/cht-test");
    });

    await act(async () => {
      await router.navigate({ to: "/" });
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(router.state.location.pathname).toBe("/");
    expect((getComposer() as HTMLTextAreaElement).value).toBe("");
    expect(screen.queryByText("Chat stub")).toBeNull();

    restore();
  });

  it("does not send an empty message", async () => {
    mockDesktopPointer();
    const { fetchMock, restore } = mockFetch(
      createSseResponse([
        {
          event: "chat",
          data: {
            id: "cht-test",
            title: "Hello",
            createdAt: "2026-06-13T00:00:00.000Z",
            updatedAt: "2026-06-13T00:00:00.000Z",
          },
        },
        { event: "delta", data: { text: "Agent received: Hello" } },
        { event: "done", data: { reason: "complete" } },
      ]),
    );

    await renderWithRouter([
      { path: "/", component: Home },
      { path: "/chats/$id", component: () => <div>Chat</div> },
    ]);

    const textarea = getComposer();
    const sendButton = screen.getByRole("button", { name: /send/i });

    expect(sendButton.disabled).toBe(true);

    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fetchMock).not.toHaveBeenCalled();

    restore();
  });

  it("does not send on Shift+Enter so the user can insert a newline", async () => {
    mockDesktopPointer();
    const { fetchMock, restore } = mockFetch(
      createSseResponse([
        {
          event: "chat",
          data: {
            id: "cht-test",
            title: "Hello",
            createdAt: "2026-06-13T00:00:00.000Z",
            updatedAt: "2026-06-13T00:00:00.000Z",
          },
        },
        { event: "delta", data: { text: "Agent received: Hello" } },
        { event: "done", data: { reason: "complete" } },
      ]),
    );

    await renderWithRouter([
      { path: "/", component: Home },
      { path: "/chats/$id", component: () => <div>Chat</div> },
    ]);

    const textarea = getComposer();
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fetchMock).not.toHaveBeenCalled();

    restore();
  });

  it("sends a multiline message", async () => {
    mockDesktopPointer();
    const { fetchMock, restore } = mockFetch(
      createSseResponse([
        {
          event: "chat",
          data: {
            id: "cht-test",
            title: "Line 1",
            createdAt: "2026-06-13T00:00:00.000Z",
            updatedAt: "2026-06-13T00:00:00.000Z",
          },
        },
        { event: "delta", data: { text: "Agent received: Line 1\nLine 2" } },
        { event: "done", data: { reason: "complete" } },
      ]),
    );

    await renderWithRouter([
      { path: "/", component: Home },
      { path: "/chats/$id", component: () => <div>Chat</div> },
    ]);

    const textarea = getComposer();
    fireEvent.change(textarea, { target: { value: "Line 1\nLine 2" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const [url, options] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.pathname).toBe("/api/chats/start-chat");
    expect(options.method).toBe("POST");
    expect(new TextDecoder().decode(options.body as Uint8Array)).toBe(
      JSON.stringify({ message: { text: "Line 1\nLine 2" } }),
    );

    restore();
  });
});
