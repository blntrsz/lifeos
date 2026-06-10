import { Data } from "effect";

/**
 * @since 0.0.0
 * @category errors
 */
export class TaskNameRequiredError extends Data.TaggedError("TaskNameRequiredError")<{}> {}

/**
 * @since 0.0.0
 * @category errors
 */
export class NoTaskSelectedError extends Data.TaggedError("NoTaskSelectedError")<{}> {}
