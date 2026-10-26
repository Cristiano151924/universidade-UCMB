import { cookies } from "next/headers";
import type { Profile } from "@/lib/types";
import { demoStore } from "./store";

// Login de mentirinha do modo demonstração: só guarda "quem é você" num cookie.
export const DEMO_COOKIE = "ucmb_demo_user";

export async function getDemoProfile(): Promise<Profile | null> {
  const id = (await cookies()).get(DEMO_COOKIE)?.value;
  if (!id) return null;
  const user = demoStore().users.find((u) => u.id === id);
  if (!user || !user.active) return null;
  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    active: user.active,
    created_at: user.created_at,
    last_seen_at: user.last_seen_at,
  };
}
