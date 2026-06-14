import { RegistryProvider } from "@effect/atom-react";
import type { RouteComponent } from "@tanstack/react-router";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

export function renderWithRegistry(element: ReactNode) {
  return render(<RegistryProvider>{element}</RegistryProvider>);
}

export async function renderWithRouter(
  routes: ReadonlyArray<{ readonly path: string; readonly component: RouteComponent }>,
  initialPath = "/",
) {
  const rootRoute = createRootRoute();
  const childRoutes = routes.map((route) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: route.path,
      component: route.component,
    }),
  );
  const routeTree = rootRoute.addChildren(childRoutes);
  const history = createMemoryHistory({ initialEntries: [initialPath] });
  const router = createRouter({ routeTree, history });
  await router.load();

  return {
    ...render(
      <RegistryProvider>
        <RouterProvider router={router} />
      </RegistryProvider>,
    ),
    router,
  };
}

export function createSseResponse(
  events: ReadonlyArray<{ readonly event: string; readonly data: unknown }>,
) {
  const encoder = new TextEncoder();
  let index = 0;

  const stream = new ReadableStream({
    pull(controller) {
      if (index >= events.length) {
        controller.close();
        return;
      }

      const { event, data } = events[index++];
      controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    },
  });

  return new Response(stream, { headers: { "content-type": "text/event-stream" } });
}

export function mockFetch(response: Response) {
  const originalFetch = globalThis.fetch;
  const fetchMock = vi.fn(() => Promise.resolve(response));
  globalThis.fetch = fetchMock;

  return {
    restore: () => {
      globalThis.fetch = originalFetch;
    },
    fetchMock,
  };
}

export function mockFetchWithHandler(
  handler: (url: string | URL | Request, init?: RequestInit) => Response,
) {
  const originalFetch = globalThis.fetch;
  const fetchMock = vi.fn(
    (url: string | URL | Request, init?: RequestInit) => Promise.resolve(handler(url, init)),
  );
  globalThis.fetch = fetchMock;

  return {
    restore: () => {
      globalThis.fetch = originalFetch;
    },
    fetchMock,
  };
}

export function resolveUrl(input: string | URL | Request): string {
  if (typeof input === "string") { return input; }
  if (input instanceof URL) { return input.toString(); }
  return input.url;
}

export function createChatJsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json" },
  });
}

let _originalMatchMedia: typeof window.matchMedia | null = null;

export function mockDesktopPointer() {
  if (_originalMatchMedia === null) {
    _originalMatchMedia = window.matchMedia;
  }
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: query === "(hover: hover) and (pointer: fine)",
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

export function restoreDesktopPointer() {
  if (_originalMatchMedia !== null) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: _originalMatchMedia,
    });
    _originalMatchMedia = null;
  }
}
