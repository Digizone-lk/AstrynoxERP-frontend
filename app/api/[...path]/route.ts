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

  // Forward all response headers, including Set-Cookie
  return new NextResponse(res.body, {
    status: res.status,
    headers: new Headers(res.headers),
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
