import { useQuery } from "@tanstack/react-query";
import { getSpeciesImages } from "@/lib/api";
import { SpeciesImagesResponse } from "@/lib/types";

/**
 * Custom hook for fetching species images data
 * @param taxonId The ID of the species to fetch images for
 */
export function useSpeciesImages(taxonId: string) {
  const query = useQuery({
    queryKey: ["species-images", taxonId],
    queryFn: () => getSpeciesImages(taxonId),
    staleTime: 30000, // Consider image data fresh for 30 seconds
    // Images don't change often, so we can use a longer stale time
    retry: (failureCount, error) => {
      // Don't retry on 404 - it means no images available
      if (error && 'response' in error && (error as any).response?.status === 404) {
        return false;
      }
      return failureCount < 2; // Retry only twice for other errors
    },
  });

  return {
    images: query.data?.images || [],
    imageCount: query.data?.image_count || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    // Helper functions
    hasImages: (query.data?.image_count || 0) > 0,
    primaryImage: query.data?.images?.find(img => img.is_primary) || query.data?.images?.[0] || null,
  };
}