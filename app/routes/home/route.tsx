import type { Route} from "./+types/route";
import { Welcome } from "./welcome";
import { getSession } from "~/auth/auth.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const session = await getSession(request, context.cloudflare.env);
  return {
    message: "Welcome to Fam Vacay Picker!",
    session,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <Welcome message={loaderData.message} session={loaderData.session} />;
}
