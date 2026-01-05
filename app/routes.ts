import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login/route.tsx"),
  route("api/auth/*", "routes/auth.ts"),
] satisfies RouteConfig;
