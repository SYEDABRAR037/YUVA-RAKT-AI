import { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getMissionLiveTracking } from "@/lib/services/ambulance.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/ambulance/missions/[id]/stream
 * Server-Sent Events (SSE) stream for live GPS telemetry and mission status broadcasts.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data immediately
      try {
        const data = await getMissionLiveTracking(id);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      } catch (err) {
        console.error("SSE initial data error", err);
      }

      // Interval ticker for streaming continuous updates
      const interval = setInterval(async () => {
        try {
          const data = await getMissionLiveTracking(id);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

          // If mission completed or cancelled, close stream
          if (data.mission.status === "COMPLETED" || data.mission.status === "CANCELLED") {
            clearInterval(interval);
            controller.close();
          }
        } catch (e) {
          clearInterval(interval);
          controller.close();
        }
      }, 3000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
