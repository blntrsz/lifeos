import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import type { Effect } from "effect";
import { Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";

import { AppLive } from "./layers.ts";

const ServerLive = HttpRouter.serve(AppLive).pipe(
  Layer.provideMerge(BunHttpServer.layer({ port: 3001 })),
);

const program = Layer.launch(ServerLive) as Effect.Effect<never, never, never>;

BunRuntime.runMain(program);
