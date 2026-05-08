import { useRef, useState, useCallback } from 'react'

interface VADOptions {
  onSpeakingChange: (speaking: boolean) => void
  threshold?: number      // 0-255 byte frequency average, default 18
  silenceMs?: number      // ms of silence before marking not speaking, default 600
}

export function useVAD({ onSpeakingChange, threshold = 18, silenceMs = 600 }: VADOptions) {
  const [isListening, setIsListening] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number>(0)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSpeakingRef = useRef(false)

  const stopVAD = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    audioCtxRef.current?.close()
    streamRef.current = null
    audioCtxRef.current = null
    analyserRef.current = null
    isSpeakingRef.current = false
    setIsListening(false)
    onSpeakingChange(false)
  }, [onSpeakingChange])

  const startVAD = useCallback(async () => {
    if (isListening) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)

      streamRef.current = stream
      audioCtxRef.current = ctx
      analyserRef.current = analyser
      setIsListening(true)

      const data = new Uint8Array(analyser.frequencyBinCount)

      const tick = () => {
        analyser.getByteFrequencyData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) sum += data[i]
        const avg = sum / data.length

        if (avg > threshold) {
          if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
          if (!isSpeakingRef.current) {
            isSpeakingRef.current = true
            onSpeakingChange(true)
          }
        } else if (isSpeakingRef.current) {
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              isSpeakingRef.current = false
              onSpeakingChange(false)
              silenceTimerRef.current = null
            }, silenceMs)
          }
        }

        rafRef.current = requestAnimationFrame(tick)
      }

      rafRef.current = requestAnimationFrame(tick)
    } catch {
      // Mic denied — VAD unavailable but voice channel still works in fallback
      setIsListening(false)
    }
  }, [isListening, threshold, silenceMs, onSpeakingChange])

  return { isListening, startVAD, stopVAD }
}
