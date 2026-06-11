import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground sm:px-10">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-between rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-10">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
            LifeOS
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Continue your ongoing chat with your Agent.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            LifeOS is being rebuilt around durable AI chats. Task persistence remains available as
            reference code, but the product entrypoint now points at the chat-first experience.
          </p>
        </div>

        <div className="mt-12 rounded-3xl border border-border bg-background p-4 sm:p-5">
          <label htmlFor="message" className="sr-only">
            Message your Agent
          </label>
          <textarea
            id="message"
            className="min-h-32 w-full resize-none rounded-2xl border border-input bg-card p-4 text-base outline-none transition focus:border-ring"
            placeholder="Ask your Agent what to focus on next..."
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Chat persistence wiring is next.</p>
            <button
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground opacity-60"
              type="button"
              disabled
            >
              Chat coming soon
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
