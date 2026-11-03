import { NextResponse } from "next/server";

export function proxy() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/dev/design-system",
};
