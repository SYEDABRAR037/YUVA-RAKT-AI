import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { refreshAllAIIntelligence } from "@/ai/services/ai-orchestrator";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Strict access control: Government Official or Super Admin only
    if (session.role !== "GOVERNMENT_OFFICIAL" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Administrative or Government credentials required." },
        { status: 403 }
      );
    }

    const summary = await refreshAllAIIntelligence(session.userId);

    return NextResponse.json({
      success: true,
      message: "AI Intelligence Pipeline recomputed and cached successfully",
      summary,
    });
  } catch (error: any) {
    console.error("[AI Refresh API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to refresh AI models" },
      { status: 500 }
    );
  }
}
