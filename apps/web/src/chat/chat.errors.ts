import { Data } from "effect";

/**
 * @since 0.0.0
 * @category errors
 */
export class ChatMessageRequiredError extends Data.TaggedError("ChatMessageRequiredError")<{}> {}

/**
 * @since 0.0.0
 * @category errors
 */
export class ChatNetworkError extends Data.TaggedError("ChatNetworkError")<{
  readonly cause?: unknown;
}> {}

/**
 * @since 0.0.0
 * @category errors
 */
export class ChatSseError extends Data.TaggedError("ChatSseError")<{
  readonly cause?: unknown;
}> {}
