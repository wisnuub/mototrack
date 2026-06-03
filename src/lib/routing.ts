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

async function geocode(
  name: string,
  nearLat: number,
  nearLng: number,
): Promise<[number, number] | null> {
  try {
    const params = new URLSearchParams({ q: name, format: 'json', limit: '5', addressdetails: '0' })
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: {
        'User-Agent': 'MotoTrack/1.0 (https://mototrack-mu.vercel.app)',
        'Accept-Language': 'en',
      },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null
    // Pick the result closest to the rider's current position
    const sorted = [...data].sort((a: any, b: any) => {
      const dA = Math.abs(parseFloat(a.lat) - nearLat) + Math.abs(parseFloat(a.lon) - nearLng)
      const dB = Math.abs(parseFloat(b.lat) - nearLat) + Math.abs(parseFloat(b.lon) - nearLng)
      return dA - dB
    })
    return [parseFloat(sorted[0].lat), parseFloat(sorted[0].lon)]
  } catch {
    return null
  }
}

function buildInstruction(step: any): string {
  const type: string = step.maneuver.type
  const modifier: string = step.maneuver.modifier ?? ''
  const name: string = step.name?.trim() || ''
  const onto = name ? ` onto ${name}` : ''

  if (type === 'depart') return name ? `Head ${modifier || 'forward'} on ${name}` : 'Depart'
  if (type === 'arrive') return 'Arrive at your destination'
  if (type === 'turn') {
    if (modifier === 'uturn') return 'Make a U-turn'
    if (modifier === 'sharp left') return `Sharp left${onto}`
    if (modifier === 'left') return `Turn left${onto}`
    if (modifier === 'slight left') return `Keep left${onto}`
    if (modifier === 'slight right') return `Keep right${onto}`
    if (modifier === 'right') return `Turn right${onto}`
    if (modifier === 'sharp right') return `Sharp right${onto}`
    return `Turn${onto}`
  }
  if (type === 'continue') return name ? `Continue on ${name}` : 'Continue straight'
  if (type === 'merge') return name ? `Merge onto ${name}` : 'Merge'
  if (type === 'ramp') {
    if (modifier === 'left') return `Take the ramp on the left${onto}`
    if (modifier === 'right') return `Take the ramp on the right${onto}`
    return `Take the ramp${onto}`
  }
  if (type === 'fork') {
    if (modifier.includes('left')) return `Keep left${onto}`
    if (modifier.includes('right')) return `Keep right${onto}`
    return `Keep straight${onto}`
  }
  if (type === 'end of road') {
    if (modifier === 'left') return `Turn left${onto}`
    if (modifier === 'right') return `Turn right${onto}`
    return `Continue${onto}`
  }
  if (type === 'roundabout' || type === 'rotary') {
    const exit = step.maneuver.exit
    return exit ? `Take exit ${exit} at the roundabout${onto}` : `Enter roundabout${onto}`
  }
  if (type === 'exit roundabout' || type === 'exit rotary') return `Exit roundabout${onto}`
  return name ? `Continue on ${name}` : 'Continue'
}

async function fetchRoute(waypoints: [number, number][]): Promise<RouteResult | null> {
  // OSRM expects lon,lat order
  const coords = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?steps=true&geometries=geojson&overview=full`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (data.code !== 'Ok' || !data.routes?.length) return null

    const route = data.routes[0]

    // OSRM geometry uses [lon, lat] — convert to [lat, lng]
    const routeGeometry: [number, number][] = route.geometry.coordinates.map(
      ([lon, lat]: [number, number]) => [lat, lon],
    )

    const steps: NavStep[] = []
    for (const leg of route.legs) {
      for (const step of leg.steps) {
        steps.push({
          instruction: buildInstruction(step),
          maneuverType: step.maneuver.type,
          maneuverModifier: step.maneuver.modifier ?? '',
          distance: Math.round(step.distance),
          duration: Math.round(step.duration),
          // OSRM maneuver location is [lon, lat] — convert
          location: [step.maneuver.location[1], step.maneuver.location[0]],
        })
      }
    }

    return {
      routeGeometry,
      steps,
      totalDistance: Math.round(route.distance),
      totalDuration: Math.round(route.duration),
    }
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
    // Nominatim requires ≤1 req/sec
    await new Promise(r => setTimeout(r, 300))
  }
  if (stops.length === 0) return null

  const waypoints: [number, number][] = [[startLat, startLng], ...stops]
  const route = await fetchRoute(waypoints)
  if (!route) return null

  return { route, stops }
}
