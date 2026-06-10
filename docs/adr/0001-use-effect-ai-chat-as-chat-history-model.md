# Use Effect AI Chat As The Chat History Model

LifeOS stores chat history using Effect AI's `Chat` and `Prompt` abstractions as the canonical model, rather than introducing a parallel `conversations` and `messages` table model. The product may keep lightweight chat metadata for listing and labels, but the ordered chat history should stay aligned with Effect AI so streaming, tool calls, assistant messages, and provider-facing prompt semantics do not require constant translation.
