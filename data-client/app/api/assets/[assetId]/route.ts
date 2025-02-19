import { NextResponse } from "next/server";
import { updateAssetAltText } from "../../../services/webflow/assets";
import { db } from "../../../db";
import { getSession } from "../../../lib/auth/session";

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
    const accessToken = await db.getAccessTokenFromSiteId(siteId);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const asset = await updateAssetAltText(siteId, params.assetId, "", accessToken);
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
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { altText } = await request.json();
    if (!altText) {
      return NextResponse.json(
        { error: "Alt text is required" },
        { status: 400 }
      );
    }

    const accessToken = await db.getAccessTokenFromSiteId(session.siteId);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const asset = await updateAssetAltText(
      session.siteId,
      params.assetId,
      altText,
      accessToken
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
