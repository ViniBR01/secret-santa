import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { SessionData, UserRole } from "@/types";
import { familyConfig } from "./family-config";

// Session cookie name
const SESSION_COOKIE_NAME = "secret-santa-session";

// Cookie options
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
};

/**
 * Create a session token from session data
 * Simple base64 encoding (not encryption, since httpOnly provides security)
 */
export function createSessionToken(data: SessionData): string {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

/**
 * Parse a session token back to session data
 */
export function parseSessionToken(token: string): SessionData | null {
  try {
    const json = Buffer.from(token, "base64").toString("utf-8");
    return JSON.parse(json) as SessionData;
  } catch {
    return null;
  }
}

/**
 * Set session cookie
 */
export async function setSessionCookie(data: SessionData) {
  const token = createSessionToken(data);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, COOKIE_OPTIONS);
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get session data from cookies (for API routes)
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }
  
  return parseSessionToken(token);
}

/**
 * Get session from request object
 */
export function getSessionFromRequest(request: NextRequest): SessionData | null {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }
  
  return parseSessionToken(token);
}

/**
 * Require a valid session (throw if not present)
 */
export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  
  if (!session) {
    throw new Error("Unauthorized: No valid session");
  }
  
  return session;
}

/**
 * Require admin role (throw if not admin)
 */
export async function requireAdmin(): Promise<SessionData> {
  const session = await requireSession();
  
  if (session.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }
  
  return session;
}

/**
 * Require that the session belongs to the current drawer
 */
export async function requireCurrentDrawer(currentDrawerId: string): Promise<SessionData> {
  const session = await requireSession();
  
  // Admin can act as any player
  if (session.role === "admin") {
    return session;
  }
  
  // Check if the session's playerId matches the current drawer
  if (session.playerId !== currentDrawerId) {
    throw new Error("Forbidden: Not your turn");
  }
  
  return session;
}

/**
 * Validate that a playerId exists in the family configuration
 */
export function validatePlayerId(playerId: string): boolean {
  return familyConfig.members.some((member) => member.id === playerId);
}

/**
 * Verify admin secret code
 */
export function verifyAdminCode(code: string): boolean {
  const adminCode = process.env.ADMIN_SECRET_CODE;
  
  if (!adminCode) {
    console.error("ADMIN_SECRET_CODE not configured in environment variables");
    return false;
  }
  
  return code === adminCode;
}

