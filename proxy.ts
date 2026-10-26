import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE } from "@/lib/demo/session";
import { isDemo, supabasePublicKey, supabaseUrl } from "@/lib/supabase/env";

function toLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

// Roda antes de cada página: renova o login e manda para /login quem não entrou.
// A checagem de verdade (papel, bloqueio de aulas) acontece dentro das páginas e ações.
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith("/aluno") || path.startsWith("/gestor");

  if (isDemo()) {
    if (isProtected && !request.cookies.get(DEMO_COOKIE)) return toLogin(request);
    return NextResponse.next();
  }

  if (!supabaseUrl || !supabasePublicKey) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabasePublicKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims && isProtected) return toLogin(request);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
