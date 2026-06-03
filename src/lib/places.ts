const KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY ?? ''
const hasKey = Boolean(KEY && KEY !== 'YOUR_GOOGLE_PLACES_KEY')

export interface PlaceReview {
  author: string
  authorAvatar?: string
  rating: number
  text: string
  relativeTime: string
}

export interface PlaceDetails {
  placeId: string
  name: string
  rating: number
  totalRatings: number
  address: string
  photos: string[]     // ready-to-use media URLs
  reviews: PlaceReview[]
}

export function isPlacesReady() {
  return hasKey
}

export async function fetchPlaceDetails(
  name: string,
  lat: number,
  lng: number,
): Promise<PlaceDetails | null> {
  if (!hasKey) return null
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': KEY,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.rating',
          'places.userRatingCount',
          'places.formattedAddress',
          'places.photos',
          'places.reviews',
        ].join(','),
      },
      body: JSON.stringify({
        textQuery: name,
        locationBias: {
          circle: { center: { latitude: lat, longitude: lng }, radius: 10000 },
        },
        maxResultCount: 1,
        languageCode: 'en',
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const place = data.places?.[0]
    if (!place) return null

    const photos: string[] = (place.photos ?? []).slice(0, 8).map(
      (p: any) =>
        `https://places.googleapis.com/v1/${p.name}/media?maxHeightPx=480&key=${KEY}`,
    )

    const reviews: PlaceReview[] = (place.reviews ?? []).slice(0, 5).map((r: any) => ({
      author: r.authorAttribution?.displayName ?? 'Anonymous',
      authorAvatar: r.authorAttribution?.photoUri,
      rating: Math.round(r.rating ?? 0),
      text: r.text?.text ?? '',
      relativeTime: r.relativePublishTimeDescription ?? '',
    }))

    return {
      placeId: place.id,
      name: place.displayName?.text ?? name,
      rating: place.rating ?? 0,
      totalRatings: place.userRatingCount ?? 0,
      address: place.formattedAddress ?? '',
      photos,
      reviews,
    }
  } catch {
    return null
  }
}
