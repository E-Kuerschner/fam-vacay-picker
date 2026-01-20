import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home/route.tsx"),
	route("login", "routes/login/route.tsx"),
	route("vacation/:id", "routes/vacation/route.tsx"),
	route("proposals", "routes/proposals/route.tsx"),
	route("proposals/new", "routes/proposals.new/route.tsx"),
	route("api/auth/*", "routes/auth.ts"),
	route("api/unsplash", "routes/api.unsplash/route.tsx"),
	route("api/generate-activities", "routes/api.generate-activities/route.tsx"),
	route("api/generate-budget", "routes/api.generate-budget/route.tsx"),
] satisfies RouteConfig;
