import { Context, type Effect } from "effect";

/**
 * @since 0.0.0
 * @category service-interface
 */
export interface IIdService {
  create(): Effect.Effect<string, never, never>;
}

export class IdService extends Context.Service<IdService, IIdService>()("IdService") {}
