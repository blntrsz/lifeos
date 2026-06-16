import { Context, type Effect } from "effect";
import type { Prompt } from "effect/unstable/ai";

export class AgentError extends Error {
  readonly _tag = "AgentError";

  constructor(
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
  }
}

export interface IAgentService {
  complete(prompt: Prompt.Prompt): Effect.Effect<string, AgentError>;
}

export class AgentService extends Context.Service<AgentService, IAgentService>()("AgentService") {}
