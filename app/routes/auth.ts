import type { Route } from "./+types/auth";
import { getAuthFromEnv } from "~/auth/auth.server";

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = getAuthFromEnv(context.cloudflare.env);
  return auth.handler(request);
}

export async function action({ request, context }: Route.ActionArgs) {
  const auth = getAuthFromEnv(context.cloudflare.env);
  return auth.handler(request);
}
