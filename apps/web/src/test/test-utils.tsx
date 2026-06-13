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

export function mockDesktopPointer() {
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
