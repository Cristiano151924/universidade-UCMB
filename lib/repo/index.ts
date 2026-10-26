import { isDemo } from "@/lib/supabase/env";
import { demoRepo } from "./demo";
import { supabaseRepo } from "./supabase";
import type { Repo } from "./types";

export function getRepo(): Repo {
  return isDemo() ? demoRepo : supabaseRepo;
}
