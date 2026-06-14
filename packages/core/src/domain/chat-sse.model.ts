import { Schema } from "effect";
import * as Sse from "effect/unstable/encoding/Sse";

import { ChatMetadata } from "./chat.model";

export const ChatSseEvent = Schema.Union([
  Schema.Struct({
    ...Sse.EventEncoded.fields,
    event: Schema.Literal("chat"),
    data: Schema.fromJsonString(ChatMetadata),
  }),
  Schema.Struct({
    ...Sse.EventEncoded.fields,
    event: Schema.Literal("delta"),
    data: Schema.fromJsonString(Schema.Struct({ text: Schema.String })),
  }),
  Schema.Struct({
    ...Sse.EventEncoded.fields,
    event: Schema.Literal("done"),
    data: Schema.fromJsonString(Schema.Struct({ reason: Schema.Literal("complete") })),
  }),
]);

export type ChatSseEvent = typeof ChatSseEvent.Type;
