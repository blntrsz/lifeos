import { NodeFileSystem } from "@effect/platform-node-shared";
import { SqliteClient, SqliteMigrator } from "@effect/sql-sqlite-node";
import { Layer } from "effect";

const migrationsDirectory = `${import.meta.dirname}/../../migrations`;

/**
 * SQLite client + migrator for the task schema.
 *
 * Migrations live in `migrations/` as `<id>_<name>.ts` default-exporting an
 * `Effect` that uses `SqlClient`.
 */
export const layer = (filename: string) => {
  const SqlLive = SqliteClient.layer({ filename });

  const MigrateLive = SqliteMigrator.layer({
    loader: SqliteMigrator.fromFileSystem(migrationsDirectory),
  }).pipe(Layer.provide(SqlLive), Layer.provide(NodeFileSystem.layer));

  return Layer.merge(SqlLive, MigrateLive);
};
