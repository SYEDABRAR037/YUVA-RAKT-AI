import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { expandResponseRadius } from "@/lib/services/smart-mobilization.service";

/**
 * POST /api/emergency/expand-radius
 * Expands mobilization radius (Round 2) across regional zone for unresolved emergencies.
 */
export async function POST(req: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (
      session.role !== "GOVERNMENT_OFFICIAL" &&
      session.role !== "SUPER_ADMIN" &&
      session.role !== "HOSPITAL" &&
      session.role !== "BLOOD_BANK"
    ) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json({ success: false, error: "requestId is required" }, { status: 400 });
    }

    const result = await expandResponseRadius(requestId, session.userId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("[POST /api/emergency/expand-radius Error]", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
