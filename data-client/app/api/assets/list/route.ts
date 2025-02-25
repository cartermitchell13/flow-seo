import { NextResponse } from "next/server";
import { AssetService } from "../../../services/assets";
import db from "../../../lib/utils/database";

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
    const offset = searchParams.get("offset");

    if (!siteId) {
      return NextResponse.json(
        { error: "Site ID is required" },
        { status: 400 }
      );
    }

    // Get the access token from the database
    const accessToken = await db.getAccessTokenFromSiteId(siteId);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const assetService = new AssetService(accessToken);
    const response = await assetService.listAssets({
      siteId,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
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
