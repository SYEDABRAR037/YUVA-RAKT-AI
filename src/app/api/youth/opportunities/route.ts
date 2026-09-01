import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/session";
import { getDonorMatchingOpportunities } from "@/lib/services/request.service";

export async function GET() {
  try {
    const session = await getSessionFromCookie();
    if (!session || session.role !== "YOUTH_DONOR") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const opportunities = await getDonorMatchingOpportunities(session.userId);
    return NextResponse.json({ success: true, opportunities });
  } catch (error: any) {
    console.error("GET /api/youth/opportunities error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load opportunities" }, { status: 500 });
  }
}
