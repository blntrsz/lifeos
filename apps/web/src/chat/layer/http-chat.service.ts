import { ChatSseEvent } from "@template/core/domain/chat-sse.model";
import { Effect, Layer, Schema, Stream } from "effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import * as HttpClient from "effect/unstable/http/HttpClient";
import * as HttpClientRequest from "effect/unstable/http/HttpClientRequest";
import * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";

import { ChatNetworkError, ChatSseError } from "@/chat/chat.errors";
import { ChatService, type IChatService } from "@/chat/service/chat.service";

type SseLine = { readonly eventName: string; readonly data: string };

type Accumulator =
  | { readonly state: "idle" }
  | { readonly state: "event"; readonly eventName: string; readonly data: string };

const baseUrl = () => globalThis.location?.origin ?? "http://localhost:3000";

const LiveFetch = Layer.effect(
  FetchHttpClient.Fetch,
  Effect.sync(
    () => (input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init),
  ),
);

export const HttpChatService = Layer.effect(
  ChatService,
  Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient;

    const startChat: IChatService["startChat"] = (input) =>
      Effect.gen(function* () {
        const request = HttpClientRequest.post(`${baseUrl()}/api/chats/first-send`).pipe(
          HttpClientRequest.bodyJsonUnsafe(input),
        );
        const response = yield* httpClient.execute(request).pipe(
          Effect.flatMap(HttpClientResponse.filterStatusOk),
          Effect.mapError((error) => new ChatNetworkError({ cause: error })),
        );

        const events = response.stream.pipe(
          Stream.mapError((error) => new ChatNetworkError({ cause: error })),
          Stream.decodeText(),
          Stream.splitLines,
          Stream.mapAccum<Accumulator, string, SseLine>(
            () => ({ state: "idle" }),
            (acc, line) => {
              if (line === "") {
                if (acc.state === "event") {
                  return [{ state: "idle" }, [{ eventName: acc.eventName, data: acc.data }]];
                }
                return [{ state: "idle" }, []];
              }

              if (line.startsWith("event: ")) {
                return [{ state: "event", eventName: line.slice(7), data: "" }, []];
              }

              if (line.startsWith("data: ")) {
                if (acc.state === "event") {
                  const prefix = acc.data.length > 0 ? `${acc.data}\n` : "";
                  return [
                    { state: "event", eventName: acc.eventName, data: `${prefix}${line.slice(6)}` },
                    [],
                  ];
                }
                return [{ state: "event", eventName: "message", data: line.slice(6) }, []];
              }

              return [acc, []];
            },
            {
              onHalt: (acc) =>
                acc.state === "event" ? [{ eventName: acc.eventName, data: acc.data }] : [],
            },
          ),
          Stream.mapEffect((line) =>
            Effect.try({
              try: () =>
                Schema.decodeUnknownSync(ChatSseEvent)({
                  id: undefined,
                  event: line.eventName,
                  data: line.data,
                }),
              catch: (error) => new ChatSseError({ cause: error }),
            }),
          ),
        );

        return events;
      });

    return { startChat };
  }),
).pipe(Layer.provide(FetchHttpClient.layer), Layer.provide(LiveFetch));
