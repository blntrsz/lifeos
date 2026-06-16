import { Effect, Layer, Schema } from "effect";
import { Prompt } from "effect/unstable/ai";

import { AgentError, AgentService, type IAgentService } from "./service/agent.service";

type DeepSeekAgentConfig = {
  readonly apiKey: string;
  readonly baseUrl?: string;
  readonly model?: string;
};

const DeepSeekResponse = Schema.Struct({
  choices: Schema.NonEmptyArray(
    Schema.Struct({
      message: Schema.Struct({
        content: Schema.String,
      }),
    }),
  ),
});

const extractText = (content: Prompt.Message["content"]) => {
  if (typeof content === "string") {
    return content;
  }

  return content
    .filter((part): part is Prompt.TextPart => part.type === "text")
    .map((part) => part.text)
    .join("\n");
};

const toDeepSeekMessages = (prompt: Prompt.Prompt) =>
  prompt.content
    .filter(
      (
        message,
      ): message is Extract<Prompt.Message, { readonly role: "system" | "user" | "assistant" }> =>
        message.role === "system" || message.role === "user" || message.role === "assistant",
    )
    .map((message) => ({ role: message.role, content: extractText(message.content) }))
    .filter((message) => message.content.trim().length > 0);

export const DeepSeekAgentService = (config: DeepSeekAgentConfig) =>
  Layer.succeed(
    AgentService,
    AgentService.of({
      complete: Effect.fn("DeepSeekAgentService.complete")(function* (prompt) {
        if (config.apiKey.trim().length === 0) {
          return yield* Effect.fail(new AgentError("DEEPSEEK_API_KEY is required"));
        }

        const messages = toDeepSeekMessages(prompt);
        const body = {
          model: config.model ?? "deepseek-v4-pro",
          messages,
          stream: false,
        };

        const response = yield* Effect.tryPromise({
          try: () =>
            fetch(`${config.baseUrl ?? "https://api.deepseek.com"}/chat/completions`, {
              method: "POST",
              headers: {
                authorization: `Bearer ${config.apiKey}`,
                "content-type": "application/json",
              },
              body: JSON.stringify(body),
            }),
          catch: (error) => new AgentError("DeepSeek request failed", error),
        });

        if (!response.ok) {
          const responseText = yield* Effect.tryPromise({
            try: () => response.text(),
            catch: (error) => new AgentError("DeepSeek error response could not be read", error),
          });

          return yield* Effect.fail(
            new AgentError(`DeepSeek returned ${response.status}: ${responseText}`),
          );
        }

        const json = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: (error) => new AgentError("DeepSeek response was not valid JSON", error),
        });
        const parsed = yield* Schema.decodeUnknownEffect(DeepSeekResponse)(json).pipe(
          Effect.mapError(
            (error) => new AgentError("DeepSeek response did not match expected shape", error),
          ),
        );

        return parsed.choices[0].message.content;
      }),
    } satisfies IAgentService),
  );
