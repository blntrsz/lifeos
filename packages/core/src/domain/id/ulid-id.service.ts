import { Effect, Layer } from "effect";
import { ulid } from "ulid";

import { IdService } from "./service/id.service";

export const UlidIdService = Layer.effect(
  IdService,
  Effect.sync(() => {
    /**
     * @since 0.0.0
     * @category service-method
     */
    const create = () => Effect.sync(() => ulid());

    return {
      create,
    };
  }),
);
