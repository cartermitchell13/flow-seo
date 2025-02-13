import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface AssetVariant {
  hostedUrl: string;
  originalFileName: string;
  displayName: string;
  format: string;
  width: number;
  height: number;
  quality: number;
}

interface Asset {
  id: string;
  contentType: string;
  size: number;
  siteId: string;
  hostedUrl: string;
  originalFileName: string;
  displayName: string;
  lastUpdated: string;
  createdOn: string;
  variants: AssetVariant[];
  altText?: string;
}

interface ListAssetsResponse {
  assets: Asset[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

/**
 * Hook for managing Webflow assets
 * Provides functionality to list, get, and update assets
 */
export function useAssets(siteId: string) {
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const limit = 50; // Number of assets to fetch per page
  const baseUrl = import.meta.env.VITE_NEXTJS_API_URL;

  // Fetch assets list
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery<ListAssetsResponse>({
    queryKey: ['assets', siteId, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        siteId,
        offset: offset.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(
        `${baseUrl}/api/assets/list?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch assets');
      }

      return response.json();
    },
  });

  // Update asset alt text
  const updateAltText = useMutation({
    mutationFn: async ({ assetId, altText }: { assetId: string; altText: string }) => {
      const params = new URLSearchParams({ siteId });
      const response = await fetch(
        `${baseUrl}/api/assets/${assetId}?${params.toString()}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ altText }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update asset');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate the assets query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ['assets', siteId] });
    },
  });

  // Load more assets
  const loadMore = () => {
    if (data && offset + limit < data.pagination.total) {
      setOffset(prev => prev + limit);
    }
  };

  const hasNextPage = data ? offset + limit < data.pagination.total : false;

  return {
    assets: data?.assets || [],
    hasNextPage,
    isLoading,
    error,
    loadMore,
    updateAltText,
    refetch,
  };
}
