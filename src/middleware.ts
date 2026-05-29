// Auth is enforced in the (app) route-group layout via getSession() — no middleware needed.
export const config = { matcher: [] };
export default function middleware() {}
