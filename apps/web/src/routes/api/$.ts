import { createFileRoute } from "@tanstack/react-router";
import { handleRequest } from "@template/api/layers";

const handleApiRequest = ({ request }: { readonly request: Request }) => handleRequest(request);

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: handleApiRequest,
      POST: handleApiRequest,
      PATCH: handleApiRequest,
      DELETE: handleApiRequest,
      PUT: handleApiRequest,
      OPTIONS: handleApiRequest,
      HEAD: handleApiRequest,
    },
  },
});
