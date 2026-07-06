import { FreshContext } from "$fresh/server.ts";

export const handler = (_req: Request, _ctx: FreshContext): Response => {
  return Response.redirect(new URL("/resume.pdf", _req.url), 302);
};
