import { cookies } from "next/headers";
import { getIronSession, SessionOptions } from "iron-session";

export type SessionData = {
  userId?: number;
  email?: string;
  name?: string;
  role?: string;
};

export const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_PASSWORD ||
    "change-this-to-a-long-random-secret-of-at-least-32-characters!!",
  cookieName: "berger_inv_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireUser() {
  const session = await getSession();
  if (!session.userId) {
    throw new Error("UNAUTHENTICATED");
  }
  return { id: session.userId, email: session.email!, name: session.name! };
}
