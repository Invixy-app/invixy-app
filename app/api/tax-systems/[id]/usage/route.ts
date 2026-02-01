import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { getTaxSystemUsage } from "@/lib/taxSystem";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    const usage = await getTaxSystemUsage(id, businessId);
    return NextResponse.json(usage);
  } catch (error: any) {
    console.error("Error fetching tax system usage:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tax system usage" },
      { status: 500 }
    );
  }
}
