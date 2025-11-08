import { getServerSession } from "next-auth";
import { authOptions } from "./auth-config";

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }
  return session;
}