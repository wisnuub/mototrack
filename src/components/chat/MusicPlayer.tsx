import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store/useStore'
import { SkipBack, SkipForward, Play, Pause, Volume2, VolumeX, X, ListMusic, Youtube } from 'lucide-react'
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer'

const YT_CONTAINER_ID = 'yt-player-hidden'

export default function MusicPlayer() {
  const queue = useStore(s => s.musicQueue)
  const index = useStore(s => s.musicIndex)
  const isPlaying = useStore(s => s.isMusicPlaying)
  const isListeningAlong = useStore(s => s.isListeningAlong)
  const volume = useStore(s => s.musicVolume)

  // Only produce audio output if user opted into listening along
  const shouldPlay = isPlaying && isListeningAlong
  const skipTrack = useStore(s => s.skipTrack)
  const prevTrack = useStore(s => s.prevTrack)
  const pauseMusic = useStore(s => s.pauseMusic)
  const resumeMusic = useStore(s => s.resumeMusic)
  const stopMusic = useStore(s => s.stopMusic)
  const setMusicVolume = useStore(s => s.setMusicVolume)

  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showQueue, setShowQueue] = useState(false)
  const [muted, setMuted] = useState(false)
  const [playerError, setPlayerError] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const { loadVideo, pause, resume, setVolume, mute, unmute, getTime, getDuration, seekTo } =
    useYouTubePlayer({
      containerId: YT_CONTAINER_ID,
      onEnded: skipTrack,
      onError: () => {
        setPlayerError(true)
        setTimeout(() => { setPlayerError(false); skipTrack() }, 2500)
      },
    })

  const track = queue[index]

  // Load new track when it changes
  useEffect(() => {
    if (!track?.id) return
    setProgress(0)
    setDuration(0)
    setPlayerError(false)
    loadVideo(track.id)
  }, [track?.id])

  // Play / pause (respects listenAlong opt-in)
  useEffect(() => {
    if (shouldPlay) resume(); else pause()
  }, [shouldPlay])

  // Volume / mute
  useEffect(() => {
    if (muted) mute(); else { unmute(); setVolume(volume) }
  }, [volume, muted])

  // Progress polling while playing
  useEffect(() => {
    clearInterval(intervalRef.current)
    if (!shouldPlay) return
    intervalRef.current = setInterval(() => {
      setProgress(getTime())
      const d = getDuration()
      if (d > 0) setDuration(d)
    }, 500)
    return () => clearInterval(intervalRef.current)
  }, [isPlaying])

  const fmt = (s: number) =>
    isNaN(s) || s === 0 ? '–:––'
    : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  const pct = duration > 0 ? Math.min((progress / duration) * 100, 100) : 0

  return (
    <>
      {/* Hidden YouTube iframe container — always in DOM */}
      <div
        id={YT_CONTAINER_ID}
        style={{ position: 'fixed', left: '-9999px', top: '-9999px', width: 1, height: 1, pointerEvents: 'none' }}
      />

      {/* Visible player — only when queue has tracks */}
      {track && (
        <div className="fixed bottom-[64px] left-0 right-0 z-30 px-3 pb-1 pointer-events-none">
          <div className="bg-bg-secondary/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">

            {/* Progress bar — clickable seek */}
            <div
              className="h-1 bg-white/10 cursor-pointer"
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect()
                const pct = (e.clientX - rect.left) / rect.width
                seekTo(pct * duration)
                setProgress(pct * duration)
              }}
            >
              <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
            </div>

            {playerError && (
              <div className="bg-moto-red/10 border-b border-moto-red/20 px-3 py-1.5">
                <p className="text-moto-red text-xs text-center">Playback error — skipping…</p>
              </div>
            )}

            <div className="px-3 py-2.5 flex items-center gap-3">
              {/* Artwork */}
              <div className="relative flex-shrink-0">
                <img
                  src={track.artworkUrl}
                  alt={track.title}
                  className="w-10 h-10 rounded-lg object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = '' }}
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FF0000] rounded-sm flex items-center justify-center">
                  <Youtube size={9} className="text-white" />
                </div>
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate leading-tight">{track.title}</p>
                <p className="text-gray-400 text-xs truncate">{track.artist}</p>
              </div>

              {/* Time */}
              <span className="text-gray-500 text-[10px] flex-shrink-0 tabular-nums">
                {fmt(progress)}/{fmt(duration)}
              </span>

              {/* Controls */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={prevTrack} disabled={index === 0} className="w-7 h-7 flex items-center justify-center text-gray-400 disabled:opacity-30">
                  <SkipBack size={16} />
                </button>
                <button
                  onClick={() => isPlaying ? pauseMusic() : resumeMusic()}
                  className="w-8 h-8 bg-accent rounded-full flex items-center justify-center active:scale-95 transition-transform"
                >
                  {isPlaying
                    ? <Pause size={15} className="text-white" />
                    : <Play size={15} className="text-white ml-0.5" />
                  }
                </button>
                <button onClick={skipTrack} disabled={index >= queue.length - 1} className="w-7 h-7 flex items-center justify-center text-gray-400 disabled:opacity-30">
                  <SkipForward size={16} />
                </button>
              </div>

              {/* Mute */}
              <button onClick={() => setMuted(m => !m)} className="w-7 h-7 flex items-center justify-center text-gray-400 flex-shrink-0">
                {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              {/* Queue */}
              {queue.length > 1 && (
                <button
                  onClick={() => setShowQueue(v => !v)}
                  className={`w-7 h-7 flex items-center justify-center flex-shrink-0 ${showQueue ? 'text-accent' : 'text-gray-400'}`}
                >
                  <ListMusic size={16} />
                </button>
              )}

              {/* Close */}
              <button onClick={stopMusic} className="w-7 h-7 flex items-center justify-center text-gray-500 flex-shrink-0">
                <X size={15} />
              </button>
            </div>

            {/* Volume slider */}
            {!muted && (
              <div className="px-4 pb-2 flex items-center gap-2">
                <Volume2 size={11} className="text-gray-500" />
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={volume}
                  onChange={e => setMusicVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1 accent-accent cursor-pointer"
                />
              </div>
            )}

            {/* Queue list */}
            {showQueue && queue.length > 1 && (
              <div className="border-t border-white/5 max-h-44 overflow-y-auto">
                {queue.map((t, i) => (
                  <div key={t.id} className={`flex items-center gap-2 px-3 py-2 ${i === index ? 'bg-accent/10' : ''}`}>
                    <span className="text-gray-500 text-[10px] w-4 flex-shrink-0 tabular-nums text-right">{i + 1}</span>
                    <img src={t.artworkUrl} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs truncate ${i === index ? 'text-accent font-semibold' : 'text-gray-300'}`}>{t.title}</p>
                      <p className="text-gray-500 text-[10px] truncate">{t.artist}</p>
                    </div>
                    {i === index && isPlaying && (
                      <span className="text-accent text-[10px] flex-shrink-0 animate-pulse">▶</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
