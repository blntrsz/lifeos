import { dirname } from "node:path";

import { SqliteClient, SqliteMigrator } from "@effect/sql-sqlite-bun";
import { Effect, FileSystem, Layer } from "effect";

import initialTaskMigration from "../migrations/0001-task";
import initialChatMigration from "../migrations/0002-chat";

const loadMigrations = SqliteMigrator.fromRecord({
  "0001_task": initialTaskMigration,
  "0002_chat": initialChatMigration,
});

/**
 * SQLite client + migrator for LifeOS persisted app data.
 *
 * Migrations are registered here so app code depends on one LifeOS database
 * layer rather than persistence details for each dormant starter slice.
 */
export const LifeOsDatabaseLive = (filename: string) => {
  const SqlLive = SqliteClient.layer({ filename });

  return Layer.unwrap(
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      yield* fs.makeDirectory(dirname(filename), { recursive: true });

      const migrate = SqliteMigrator.run({
        loader: loadMigrations,
      });

      yield* Effect.provide(migrate, SqlLive);

      return SqlLive;
    }),
  );
};
