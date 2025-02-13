import { NextResponse } from "next/server";
import { AssetService } from "../../../services/assets";
import { db } from "../../../db";

/**
 * GET /api/assets/list
 * 
 * Lists assets from the specified site
 * Requires authentication token from the database
 * Supports pagination through cursor-based pagination
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const cursor = searchParams.get("cursor");
    const limit = searchParams.get("limit");

    if (!siteId) {
      return NextResponse.json(
        { error: "Site ID is required" },
        { status: 400 }
      );
    }

    // Get the access token from the database
    const auth = await db.getAuth();
    if (!auth?.access_token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const assetService = new AssetService(auth.access_token);
    const response = await assetService.listAssets({
      siteId,
      cursor: cursor || undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error listing assets:", error);
    return NextResponse.json(
      { error: "Failed to list assets" },
      { status: 500 }
    );
  }
}
