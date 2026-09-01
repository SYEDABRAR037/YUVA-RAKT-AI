import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/session";
import { getDonorDonationHistory } from "@/lib/services/donation.service";

export async function GET() {
  try {
    const session = await getSessionFromCookie();
    if (!session || session.role !== "YOUTH_DONOR") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const donations = await getDonorDonationHistory(session.userId);
    return NextResponse.json({ success: true, donations });
  } catch (error: any) {
    console.error("GET /api/youth/donations error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load donations" }, { status: 500 });
  }
}
