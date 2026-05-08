import { useEffect } from 'react'
import { useStore } from '../../store/useStore'
import { Wind, Droplets, Thermometer, Eye, Sun, Cloud, CloudRain, CloudLightning, CloudSnow } from 'lucide-react'

const BALI_LAT = -8.4095
const BALI_LNG = 115.1889

function weatherIcon(code: number, size = 'text-5xl') {
  if (code === 0 || code === 1) return <span className={size}>☀️</span>
  if (code === 2) return <span className={size}>⛅</span>
  if (code === 3) return <span className={size}>☁️</span>
  if (code >= 45 && code <= 48) return <span className={size}>🌫️</span>
  if (code >= 51 && code <= 67) return <span className={size}>🌧️</span>
  if (code >= 71 && code <= 77) return <span className={size}>❄️</span>
  if (code >= 80 && code <= 82) return <span className={size}>🌦️</span>
  if (code >= 95) return <span className={size}>⛈️</span>
  return <span className={size}>🌤️</span>
}

function rideability(code: number, wind: number) {
  if (code >= 95) return { label: 'Not Recommended', color: 'text-moto-red', bg: 'bg-moto-red/20', icon: '⛔' }
  if (code >= 61 || wind > 50) return { label: 'Ride with Caution', color: 'text-moto-yellow', bg: 'bg-moto-yellow/20', icon: '⚠️' }
  if (code >= 51 || wind > 30) return { label: 'Acceptable', color: 'text-accent-amber', bg: 'bg-accent-amber/20', icon: '🟡' }
  return { label: 'Perfect for Riding', color: 'text-moto-green', bg: 'bg-moto-green/20', icon: '✅' }
}

function HourlyBar({ hour, temp, precipProb, code }: { hour: number; temp: number; precipProb: number; code: number }) {
  const now = new Date().getHours()
  const isCurrent = hour === now || (hour <= now && hour + 1 > now)
  const label = hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`
  return (
    <div className={`flex flex-col items-center gap-1 min-w-[52px] rounded-xl py-1 ${isCurrent ? 'bg-accent/10' : ''}`}>
      <span className={`text-xs font-semibold ${isCurrent ? 'text-accent' : 'text-gray-500'}`}>{label}</span>
      {weatherIcon(code, 'text-xl')}
      <span className={`text-sm font-bold ${isCurrent ? 'text-accent' : 'text-white'}`}>{temp}°</span>
      {precipProb > 0 && (
        <span className="text-blue-400 text-[10px]">{precipProb}%</span>
      )}
    </div>
  )
}

export default function WeatherPanel() {
  const weather = useStore(s => s.weather)
  const loading = useStore(s => s.weatherLoading)
  const fetchWeather = useStore(s => s.fetchWeather)

  useEffect(() => {
    if (!weather) fetchWeather(BALI_LAT, BALI_LNG)
  }, [])

  const ride = weather ? rideability(weather.weatherCode, weather.windSpeed) : null

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-white font-bold text-xl">Weather</h2>
        <button
          onClick={() => fetchWeather(BALI_LAT, BALI_LNG)}
          disabled={loading}
          className="text-accent text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Updating…' : 'Refresh'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {loading && !weather && (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-4xl mb-4 animate-pulse">🌤️</span>
            <p className="text-gray-400 text-sm">Fetching Bali weather…</p>
          </div>
        )}

        {weather && (
          <>
            {/* Main card */}
            <div className="bg-gradient-to-br from-bg-card to-bg-surface rounded-3xl p-5 border border-white/5">
              <p className="text-gray-400 text-xs mb-1">📍 {weather.location}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-6xl font-bold tracking-tight">{weather.temperature}°</p>
                  <p className="text-gray-300 text-base mt-1">{weather.description}</p>
                  <p className="text-gray-500 text-xs mt-0.5">Feels like {weather.feelsLike}°C</p>
                </div>
                {weatherIcon(weather.weatherCode, 'text-7xl')}
              </div>
            </div>

            {/* Rideability */}
            {ride && (
              <div className={`rounded-2xl p-4 border border-white/5 ${ride.bg}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{ride.icon}</span>
                  <div>
                    <p className={`font-bold text-base ${ride.color}`}>{ride.label}</p>
                    <p className="text-gray-400 text-xs">Based on current conditions for riding</p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Wind size={16} />, label: 'Wind', value: `${weather.windSpeed} km/h`, sub: 'Speed' },
                { icon: <Droplets size={16} />, label: 'Humidity', value: `${weather.humidity}%`, sub: 'Relative' },
                { icon: <Sun size={16} />, label: 'UV Index', value: `${weather.uvIndex}`, sub: getUvLabel(weather.uvIndex) },
                { icon: <Thermometer size={16} />, label: 'Feels Like', value: `${weather.feelsLike}°C`, sub: 'Real feel' },
              ].map(item => (
                <div key={item.label} className="bg-bg-card rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-accent mb-2">
                    {item.icon}
                    <span className="text-gray-400 text-xs">{item.label}</span>
                  </div>
                  <p className="text-white font-bold text-xl">{item.value}</p>
                  <p className="text-gray-500 text-xs">{item.sub}</p>
                </div>
              ))}
            </div>

            {/* Hourly forecast */}
            {weather.hourly.length > 0 && (
              <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-3">Hourly Forecast</p>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
                  {weather.hourly.map((h, i) => (
                    <HourlyBar key={i} hour={h.hour} temp={h.temp} precipProb={h.precipProb} code={h.weatherCode} />
                  ))}
                </div>
              </div>
            )}

            {/* Riding tips */}
            <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-3">🏍️ Rider Tips</p>
              <div className="space-y-2">
                {getRiderTips(weather.weatherCode, weather.windSpeed, weather.temperature).map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-base flex-shrink-0">{tip.icon}</span>
                    <p className="text-gray-300 text-xs">{tip.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-gray-600 text-xs text-center">
              Updated {weather.fetchedAt.toLocaleTimeString()} · Open-Meteo
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function getUvLabel(uv: number) {
  if (uv <= 2) return 'Low'
  if (uv <= 5) return 'Moderate'
  if (uv <= 7) return 'High'
  if (uv <= 10) return 'Very High'
  return 'Extreme'
}

function getRiderTips(code: number, wind: number, temp: number) {
  const tips = []
  if (code >= 95) tips.push({ icon: '⛈️', text: 'Thunderstorm expected. Strongly advise not to ride. Wait it out!' })
  else if (code >= 61) tips.push({ icon: '🌧️', text: 'Rain detected. Reduce speed, increase following distance, watch for slick roads.' })
  else if (code >= 51) tips.push({ icon: '🌦️', text: 'Light drizzle. Roads may be slippery — especially oil patches. Ride cautiously.' })
  else tips.push({ icon: '✅', text: 'Clear conditions. Great day to ride! Enjoy the roads.' })

  if (wind > 50) tips.push({ icon: '💨', text: `Strong winds at ${wind} km/h. Keep two hands on handlebars, avoid mountain switchbacks.` })
  else if (wind > 25) tips.push({ icon: '🌬️', text: `Moderate wind (${wind} km/h). May affect stability on exposed roads and bridges.` })

  if (temp > 34) tips.push({ icon: '🥵', text: `Very hot (${temp}°C). Stay hydrated, wear ventilated gear, take breaks in shade.` })
  else if (temp < 18) tips.push({ icon: '🥶', text: `Cool at ${temp}°C. Wear layered gear, watch for morning fog on mountain roads.` })

  tips.push({ icon: '🪖', text: 'Always wear your helmet and full gear — Bali traffic can be unpredictable.' })
  tips.push({ icon: '⛽', text: 'Check your fuel before long rides. Stations can be sparse in North Bali mountains.' })

  return tips
}
