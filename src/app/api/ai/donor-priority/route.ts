import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { rankDonorsForRequest } from "@/ai/donor-ranking/ranker";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "YOUTH_DONOR") {
      return NextResponse.json({ success: false, error: "Access forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "Parameter 'requestId' is required" },
        { status: 400 }
      );
    }

    const rankedDonors = await rankDonorsForRequest(requestId);

    return NextResponse.json({
      success: true,
      data: {
        requestId,
        rankedDonors,
        totalCandidates: rankedDonors.length,
        highPriorityCount: rankedDonors.filter((d) => d.priorityTier === "HIGH").length,
        disclaimer: "Operational decision-support priority scoring only. Does not replace clinical blood cross-matching and donor eligibility screening by medical officers.",
      },
    });
  } catch (error: any) {
    console.error("[AI Donor Priority API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
