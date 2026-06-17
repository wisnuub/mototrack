// Google Routes API v2 (TWO_WHEELER mode) + Google Geocoding API.
// Far better road accuracy in Indonesia than OSRM + Nominatim.
// Uses the same key as Places — enable "Routes API" and "Geocoding API"
// in Google Cloud Console on the same key as VITE_GOOGLE_PLACES_KEY.

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || import.meta.env.VITE_GOOGLE_PLACES_KEY || ''

export interface NavStep {
  instruction: string
  maneuverType: string
  maneuverModifier: string
  distance: number        // metres to the next maneuver
  duration: number        // seconds
  location: [number, number]  // [lat, lng] where the maneuver happens
}

export interface RouteResult {
  routeGeometry: [number, number][]  // [lat, lng] pairs
  steps: NavStep[]
  totalDistance: number   // metres
  totalDuration: number   // seconds
}

export function isRoutingReady(): boolean {
  return !!API_KEY
}

// Google Geocoding API — much better for Indonesian place names than Nominatim
async function geocode(
  name: string,
  nearLat: number,
  nearLng: number,
): Promise<[number, number] | null> {
  try {
    const params = new URLSearchParams({
      address: name,
      region: 'id',
      language: 'id',
      key: API_KEY,
    })
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 'OK' || !data.results?.length) return null
    // Pick result closest to rider position when multiple results returned
    let best = data.results[0]
    let bestDist = Infinity
    for (const r of data.results) {
      const { lat, lng } = r.geometry.location
      const d = Math.hypot(lat - nearLat, lng - nearLng)
      if (d < bestDist) { bestDist = d; best = r }
    }
    return [best.geometry.location.lat, best.geometry.location.lng]
  } catch {
    return null
  }
}

// Google's encoded polyline algorithm decoder
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = []
  let index = 0, lat = 0, lng = 0
  while (index < encoded.length) {
    let b: number, shift = 0, result = 0
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
    lat += (result & 1) ? ~(result >> 1) : result >> 1
    shift = 0; result = 0
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5 } while (b >= 0x20)
    lng += (result & 1) ? ~(result >> 1) : result >> 1
    points.push([lat / 1e5, lng / 1e5])
  }
  return points
}

// Map Google maneuver enums → OSRM-style type/modifier so RideMap.tsx icons don't change
function mapManeuver(gm: string): { type: string; modifier: string } {
  const map: Record<string, { type: string; modifier: string }> = {
    DEPART:            { type: 'depart',     modifier: '' },
    ARRIVE:            { type: 'arrive',     modifier: '' },
    TURN_LEFT:         { type: 'turn',       modifier: 'left' },
    TURN_RIGHT:        { type: 'turn',       modifier: 'right' },
    TURN_SLIGHT_LEFT:  { type: 'turn',       modifier: 'slight left' },
    TURN_SLIGHT_RIGHT: { type: 'turn',       modifier: 'slight right' },
    TURN_SHARP_LEFT:   { type: 'turn',       modifier: 'sharp left' },
    TURN_SHARP_RIGHT:  { type: 'turn',       modifier: 'sharp right' },
    ROUNDABOUT_LEFT:   { type: 'roundabout', modifier: 'left' },
    ROUNDABOUT_RIGHT:  { type: 'roundabout', modifier: 'right' },
    U_TURN_LEFT:       { type: 'continue',   modifier: 'uturn' },
    U_TURN_RIGHT:      { type: 'continue',   modifier: 'uturn' },
    STRAIGHT:          { type: 'continue',   modifier: 'straight' },
    RAMP_LEFT:         { type: 'ramp',       modifier: 'left' },
    RAMP_RIGHT:        { type: 'ramp',       modifier: 'right' },
    MERGE:             { type: 'merge',      modifier: 'straight' },
    FERRY:             { type: 'ferry',      modifier: '' },
  }
  return map[gm] ?? { type: 'continue', modifier: 'straight' }
}

// Google Routes API v2 — supports TWO_WHEELER (motorcycle) travel mode
export async function fetchRoute(waypoints: [number, number][]): Promise<RouteResult | null> {
  if (waypoints.length < 2 || !API_KEY) return null

  const [oLat, oLng] = waypoints[0]
  const [dLat, dLng] = waypoints[waypoints.length - 1]
  const intermediates = waypoints.slice(1, -1).map(([lat, lng]) => ({
    location: { latLng: { latitude: lat, longitude: lng } },
  }))

  const body: Record<string, unknown> = {
    origin:      { location: { latLng: { latitude: oLat, longitude: oLng } } },
    destination: { location: { latLng: { latitude: dLat, longitude: dLng } } },
    travelMode:  'TWO_WHEELER',
    routingPreference: 'TRAFFIC_AWARE',
    languageCode: 'id',
    units: 'METRIC',
    computeAlternativeRoutes: false,
  }
  if (intermediates.length) body.intermediates = intermediates

  try {
    const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': [
          'routes.distanceMeters',
          'routes.duration',
          'routes.polyline.encodedPolyline',
          'routes.legs.steps.navigationInstruction',
          'routes.legs.steps.distanceMeters',
          'routes.legs.steps.staticDuration',
          'routes.legs.steps.startLocation',
        ].join(','),
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) return null
    const data = await res.json()
    const route = data.routes?.[0]
    if (!route) return null

    const routeGeometry = decodePolyline(route.polyline.encodedPolyline)
    const totalDistance = route.distanceMeters as number
    // duration comes back as "1234s"
    const totalDuration = parseInt(String(route.duration))

    const steps: NavStep[] = []
    for (const leg of route.legs ?? []) {
      for (const step of leg.steps ?? []) {
        const nav = step.navigationInstruction as { maneuver: string; instructions: string } | undefined
        const { type, modifier } = mapManeuver(nav?.maneuver ?? '')
        steps.push({
          instruction: nav?.instructions ?? 'Continue',
          maneuverType: type,
          maneuverModifier: modifier,
          distance: step.distanceMeters ?? 0,
          duration: step.staticDuration ? parseInt(String(step.staticDuration)) : 0,
          location: step.startLocation?.latLng
            ? [step.startLocation.latLng.latitude, step.startLocation.latLng.longitude]
            : routeGeometry[0],
        })
      }
    }

    return { routeGeometry, steps, totalDistance, totalDuration }
  } catch {
    return null
  }
}

export async function planRoute(
  startLat: number,
  startLng: number,
  destinationNames: string[],
): Promise<{ route: RouteResult; stops: [number, number][] } | null> {
  const stops: [number, number][] = []
  for (const name of destinationNames) {
    const coords = await geocode(name, startLat, startLng)
    if (coords) stops.push(coords)
    // No rate-limit delay needed with Google API key (unlike Nominatim)
  }
  if (stops.length === 0) return null

  const waypoints: [number, number][] = [[startLat, startLng], ...stops]
  const route = await fetchRoute(waypoints)
  if (!route) return null

  return { route, stops }
}
