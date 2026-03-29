import { NextRequest, NextResponse } from "next/server";

// Always use https — guards against NEXT_PUBLIC_API_URL accidentally set to http://
const BACKEND = process.env.NEXT_PUBLIC_API_URL!.replace(/^http:\/\//, "https://");

async function handler(req: NextRequest): Promise<NextResponse> {
  const { pathname, search } = new URL(req.url);
  const targetUrl = `${BACKEND}${pathname}${search}`;

  // Forward all request headers, including Cookie
  const headers = new Headers(req.headers);
  headers.delete("host"); // let fetch set the correct host for the target

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "follow", // follow redirects server-side; never expose Railway URL to browser
  };

  if (!["GET", "HEAD", "DELETE"].includes(req.method)) {
    // @ts-expect-error — duplex is required for streaming request bodies
    init.duplex = "half";
    init.body = req.body;
  }

  const res = await fetch(targetUrl, init);

  // Build response headers — handle Set-Cookie separately because
  // Headers.set() merges multiple Set-Cookie values into one (invalid).
  // Each cookie must be its own header for the browser to store them correctly.
  //
  // Strip the Domain attribute so the browser stores cookies scoped to the
  // Vercel domain rather than the Railway backend domain (which browsers reject).
  const responseHeaders = new Headers();
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") {
      responseHeaders.set(key, value);
    }
  });
  const cookies = res.headers.getSetCookie?.() ?? [];
  cookies.forEach((cookie) => {
    const stripped = cookie.replace(/;\s*domain=[^;]+/gi, "");
    responseHeaders.append("set-cookie", stripped);
  });

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
