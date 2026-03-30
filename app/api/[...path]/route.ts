import { NextRequest, NextResponse } from "next/server";

// Always use https — guards against NEXT_PUBLIC_API_URL accidentally set to http://
const BACKEND = process.env.NEXT_PUBLIC_API_URL!.replace(/^http:\/\//, "https://");

async function handler(req: NextRequest): Promise<NextResponse> {
  const { pathname, search } = new URL(req.url);
  const targetUrl = `${BACKEND}${pathname}${search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");

  let body: ArrayBuffer | undefined;
  if (!["GET", "HEAD", "DELETE"].includes(req.method) && req.body) {
    body = await req.arrayBuffer();
  }

  let res: Response;
  try {
    res = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
    });

    // Follow redirects manually so the Authorization header is never dropped.
    // fetch(redirect:"follow") strips Authorization on redirects (security rule).
    // Always preserve the original method — for an API proxy, FastAPI trailing-slash
    // redirects (301/307) must never convert POST/PATCH/DELETE into GET.
    let hops = 0;
    while (res.status >= 300 && res.status < 400 && hops < 5) {
      const location = res.headers.get("location");
      if (!location) break;
      const next = location.startsWith("http") ? location : `${BACKEND}${location}`;
      res = await fetch(next, {
        method: req.method,
        headers,
        body,
        redirect: "manual",
      });
      hops++;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upstream fetch failed";
    return new NextResponse(JSON.stringify({ error: message, target: targetUrl }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  const responseHeaders = new Headers(res.headers);
  return new NextResponse(res.body, {
    status: res.status,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
