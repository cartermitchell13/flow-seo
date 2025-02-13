import { NextResponse } from "next/server";
import { AssetService } from "../../../services/assets";
import { db } from "../../../db";

/**
 * GET /api/assets/[assetId]
 * 
 * Gets a single asset by ID
 * Requires authentication token from the database
 */
export async function GET(
  request: Request,
  { params }: { params: { assetId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

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
    const asset = await assetService.getAsset(siteId, params.assetId);

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Error getting asset:", error);
    return NextResponse.json(
      { error: "Failed to get asset" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/assets/[assetId]
 * 
 * Updates an asset's metadata (like alt text)
 * Requires authentication token from the database
 */
export async function PATCH(
  request: Request,
  { params }: { params: { assetId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const body = await request.json();

    if (!siteId) {
      return NextResponse.json(
        { error: "Site ID is required" },
        { status: 400 }
      );
    }

    if (!body.alt) {
      return NextResponse.json(
        { error: "Alt text is required" },
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
    const asset = await assetService.updateAssetAltText(
      siteId,
      params.assetId,
      body.alt
    );

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Error updating asset:", error);
    return NextResponse.json(
      { error: "Failed to update asset" },
      { status: 500 }
    );
  }
}
