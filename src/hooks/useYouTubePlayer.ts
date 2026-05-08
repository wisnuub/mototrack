import { useCallback, useEffect, useRef } from 'react'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

// Module-level singleton — API loads once across all component instances
let apiState: 'idle' | 'loading' | 'ready' = 'idle'
const readyQueue: Array<() => void> = []

function ensureYTApi() {
  if (apiState !== 'idle') return
  apiState = 'loading'
  const script = document.createElement('script')
  script.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(script)
  window.onYouTubeIframeAPIReady = () => {
    apiState = 'ready'
    readyQueue.splice(0).forEach(cb => cb())
  }
}

function whenReady(cb: () => void) {
  if (apiState === 'ready') { cb(); return }
  ensureYTApi()
  readyQueue.push(cb)
}

interface UseYTPlayerOptions {
  containerId: string
  onEnded: () => void
  onError?: () => void
}

export function useYouTubePlayer({ containerId, onEnded, onError }: UseYTPlayerOptions) {
  const playerRef = useRef<any>(null)
  const onEndedRef = useRef(onEnded)
  const onErrorRef = useRef(onError)

  useEffect(() => { onEndedRef.current = onEnded }, [onEnded])
  useEffect(() => { onErrorRef.current = onError }, [onError])

  useEffect(() => {
    ensureYTApi()
    return () => {
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [])

  const loadVideo = useCallback((videoId: string) => {
    whenReady(() => {
      if (playerRef.current) {
        try { playerRef.current.loadVideoById(videoId) } catch {
          playerRef.current.destroy()
          playerRef.current = null
          createNew(videoId)
        }
      } else {
        createNew(videoId)
      }
    })
  }, [containerId])

  function createNew(videoId: string) {
    playerRef.current = new window.YT.Player(containerId, {
      videoId,
      width: 1,
      height: 1,
      playerVars: { autoplay: 1, controls: 0, rel: 0, modestbranding: 1, iv_load_policy: 3 },
      events: {
        onStateChange: (e: any) => {
          if (e.data === window.YT?.PlayerState?.ENDED) onEndedRef.current()
        },
        onError: () => onErrorRef.current?.(),
      },
    })
  }

  const pause = useCallback(() => { try { playerRef.current?.pauseVideo() } catch {} }, [])
  const resume = useCallback(() => { try { playerRef.current?.playVideo() } catch {} }, [])
  const setVolume = useCallback((v: number) => { try { playerRef.current?.setVolume(Math.round(v * 100)) } catch {} }, [])
  const mute = useCallback(() => { try { playerRef.current?.mute() } catch {} }, [])
  const unmute = useCallback(() => { try { playerRef.current?.unMute() } catch {} }, [])
  const getTime = useCallback((): number => { try { return playerRef.current?.getCurrentTime() ?? 0 } catch { return 0 } }, [])
  const getDuration = useCallback((): number => { try { return playerRef.current?.getDuration() ?? 0 } catch { return 0 } }, [])
  const seekTo = useCallback((s: number) => { try { playerRef.current?.seekTo(s, true) } catch {} }, [])

  return { loadVideo, pause, resume, setVolume, mute, unmute, getTime, getDuration, seekTo }
}
