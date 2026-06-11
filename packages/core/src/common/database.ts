import { SqliteClient, SqliteMigrator } from "@effect/sql-sqlite-bun";
import { Effect, Layer } from "effect";

import initialTaskMigration from "../migrations/0001-task";

const loadMigrations = SqliteMigrator.fromRecord({
  "0001_task": initialTaskMigration,
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
      const migrate = SqliteMigrator.run({
        loader: loadMigrations,
      });

      yield* Effect.provide(migrate, SqlLive);

      return SqlLive;
    }),
  );
};
