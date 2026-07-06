import { NextResponse } from "next/server";

export function tooManyRequestsResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}
