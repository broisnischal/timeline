import "@tanstack/react-start/server-only";
import { auth } from "@/lib/auth/auth";

export async function getUserIdFromRequestSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return session?.user?.id ?? null;
}
