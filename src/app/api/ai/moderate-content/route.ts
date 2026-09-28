import { NextRequest } from "next/server";
import { denied } from "@/lib/authz";
import { requireAiUser } from "@/lib/ai-guard";
import { jsonError } from "@/lib/http";

/** Keyword lists are not a moderation provider. The route fails closed until one is configured. */
export async function POST(request: NextRequest) {
  const actor = await requireAiUser();
  if (denied(actor)) return actor;
  void request;
  return jsonError("Content moderation provider is not configured", 503);
}

export async function GET(request: NextRequest) {
  const actor = await requireAiUser();
  if (denied(actor)) return actor;
  void request;
  return jsonError("Content moderation provider is not configured", 503);
}

export async function PUT(request: NextRequest) {
  const actor = await requireAiUser();
  if (denied(actor)) return actor;
  void request;
  return jsonError("Content moderation provider is not configured", 503);
}
