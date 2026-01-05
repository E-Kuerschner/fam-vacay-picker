const UNSPLASH_API_BASE = "https://api.unsplash.com";

type CreateUnsplashClientParams = {
  accessKey: string;
};

type UnsplashPhoto = {
  id: string;
  slug: string;
  width: number;
  height: number;
  color: string;
  blur_hash: string;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    self: string;
    html: string;
    download: string;
    download_location: string;
  };
  user: {
    id: string;
    username: string;
    name: string;
    portfolio_url: string | null;
    links: {
      self: string;
      html: string;
      photos: string;
    };
  };
};

type SearchPhotosParams = {
  query: string;
  page?: number;
  perPage?: number;
  orientation?: "landscape" | "portrait" | "squarish";
};

type SearchPhotosResponse = {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
};

type GetRandomPhotoParams = {
  query?: string;
  orientation?: "landscape" | "portrait" | "squarish";
  count?: number;
};

export function createUnsplashClient({ accessKey }: CreateUnsplashClientParams) {
  const headers = {
    Authorization: `Client-ID ${accessKey}`,
    "Accept-Version": "v1",
  };

  async function request<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(`${UNSPLASH_API_BASE}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  return {
    /**
     * Search for photos by keyword
     */
    searchPhotos: ({ query, page = 1, perPage = 10, orientation }: SearchPhotosParams) =>
      request<SearchPhotosResponse>("/search/photos", {
        query,
        page,
        per_page: perPage,
        orientation,
      }),

    /**
     * Get a random photo, optionally filtered by query
     */
    getRandomPhoto: (params?: GetRandomPhotoParams) =>
      request<UnsplashPhoto | UnsplashPhoto[]>("/photos/random", {
        query: params?.query,
        orientation: params?.orientation,
        count: params?.count,
      }),

    /**
     * Get a single photo by ID
     */
    getPhoto: (id: string) => request<UnsplashPhoto>(`/photos/${id}`),

    /**
     * Track a photo download (required by Unsplash API guidelines)
     */
    trackDownload: (downloadLocation: string) =>
      fetch(downloadLocation, { headers }),
  };
}

export type UnsplashClient = ReturnType<typeof createUnsplashClient>;

export type { UnsplashPhoto, SearchPhotosResponse };

/**
 * Helper to create Unsplash client from Cloudflare env.
 * Use in loaders/actions to get the Unsplash client instance.
 */
export function getUnsplashFromEnv(env: Env) {
  return createUnsplashClient({
    accessKey: env.UNSPLASH_API_KEY,
  });
}