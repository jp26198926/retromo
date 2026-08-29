import { NextResponse } from "next/server";

// Returns which social login providers are configured (without exposing secrets).
// The sign-in / sign-up pages use this to conditionally show/hide buttons.
export async function GET() {
  return NextResponse.json({
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  });
}
