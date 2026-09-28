import { NextResponse } from "next/server";

/** Client-facing failure. The message is fixed by the caller; internals stay in the server log. */
export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message, message }, { status });
}

export function serverError(context: string, error: unknown) {
  console.error(context, error);
  return jsonError("Something went wrong", 500);
}
