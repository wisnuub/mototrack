import { useState, useRef, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import type { ChatMessage, Conversation, MusicTrack } from '../../types'
import { ChevronLeft, Send, Mic, MicOff, Phone, PhoneOff, MapPin, Plus, X, Music, Play, Pause, SkipForward, SkipBack, Trash2, Youtube, Search, ListMusic, Repeat, Headphones } from 'lucide-react'
import { useVAD } from '../../hooks/useVAD'
import { searchYouTube, fetchVideoInfo, fetchPlaylistTracks, parseYouTubeInput, YT_API_KEY } from '../../lib/youtube'

// ─── Voice Channel Bar ────────────────────────────────────────────────────────

function VoiceBar() {
  const voiceConvId = useStore(s => s.voiceConvId)
  const voiceParticipants = useStore(s => s.voiceParticipants)
  const leaveVoice = useStore(s => s.leaveVoice)
  const setVoiceSpeaking = useStore(s => s.setVoiceSpeaking)
  const setVoiceMuted = useStore(s => s.setVoiceMuted)
  const conversations = useStore(s => s.conversations)

  const [isMuted, setIsMuted] = useState(false)
  const conv = conversations.find(c => c.id === voiceConvId)

  const { isListening, startVAD, stopVAD } = useVAD({
    onSpeakingChange: (speaking) => setVoiceSpeaking('rider-1', speaking),
  })

  useEffect(() => {
    if (voiceConvId) startVAD()
    return () => stopVAD()
  }, [voiceConvId])

  useEffect(() => {
    if (!voiceConvId) return
    const others = voiceParticipants.filter(p => p.riderId !== 'rider-1')
    if (!others.length) return
    const timers = others.map(p => {
      const delay = Math.random() * 8000 + 4000
      return setInterval(() => {
        setVoiceSpeaking(p.riderId, true)
        setTimeout(() => setVoiceSpeaking(p.riderId, false), Math.random() * 2500 + 800)
      }, delay)
    })
    return () => timers.forEach(clearInterval)
  }, [voiceConvId])

  if (!voiceConvId) return null

  const toggleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    setVoiceMuted('rider-1', next)
    if (next) stopVAD(); else startVAD()
  }

  return (
    <div className="mx-3 mb-2 bg-moto-green/10 border border-moto-green/30 rounded-2xl px-3 py-2.5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-moto-green animate-pulse" />
          <span className="text-moto-green text-xs font-semibold">Voice · {conv?.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-moto-red/20 text-moto-red' : 'bg-moto-green/20 text-moto-green'
            }`}
          >
            {isMuted ? <MicOff size={13} /> : <Mic size={13} />}
          </button>
          <button
            onClick={leaveVoice}
            className="w-7 h-7 rounded-full bg-moto-red/20 text-moto-red flex items-center justify-center"
          >
            <PhoneOff size={13} />
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        {voiceParticipants.map(p => (
          <div key={p.riderId} className="flex flex-col items-center gap-0.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-base transition-all ${
                p.isSpeaking ? 'ring-2 ring-moto-green ring-offset-1 ring-offset-bg-primary scale-110' : ''
              } ${p.isMuted ? 'opacity-40' : ''}`}
              style={{ background: '#ffffff15' }}
            >
              {p.avatar}
            </div>
            <span className="text-gray-500 text-[9px] max-w-[32px] truncate">{p.name.split(' ')[0]}</span>
          </div>
        ))}
        {!isListening && !isMuted && (
          <span className="text-gray-500 text-[10px] self-center ml-1">Connecting mic…</span>
        )}
      </div>
    </div>
  )
}

// ─── Music Section ────────────────────────────────────────────────────────────

function MusicSection({ conv }: { conv: Conversation }) {
  const queue = useStore(s => s.musicQueue)
  const musicIndex = useStore(s => s.musicIndex)
  const isPlaying = useStore(s => s.isMusicPlaying)
  const musicConvId = useStore(s => s.musicConvId)
  const musicLoop = useStore(s => s.musicLoop)
  const isListeningAlong = useStore(s => s.isListeningAlong)
  const playTrack = useStore(s => s.playTrack)
  const queueTrack = useStore(s => s.queueTrack)
  const removeFromQueue = useStore(s => s.removeFromQueue)
  const skipTrack = useStore(s => s.skipTrack)
  const prevTrack = useStore(s => s.prevTrack)
  const pauseMusic = useStore(s => s.pauseMusic)
  const resumeMusic = useStore(s => s.resumeMusic)
  const stopMusic = useStore(s => s.stopMusic)
  const toggleLoop = useStore(s => s.toggleLoop)
  const setListeningAlong = useStore(s => s.setListeningAlong)
  const sendMessage = useStore(s => s.sendMessage)

  const [input, setInput] = useState('')
  const [results, setResults] = useState<MusicTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')

  const isThisConv = musicConvId === conv.id
  const currentTrack = isThisConv ? queue[musicIndex] : null

  const handleAdd = async () => {
    const val = input.trim()
    if (!val) return
    setError('')

    if (!YT_API_KEY || YT_API_KEY === 'YOUR_KEY_HERE') {
      setError('Add your YouTube API key to .env → VITE_YOUTUBE_API_KEY')
      return
    }

    const parsed = parseYouTubeInput(val)
    setLoading(true)

    try {
      if (parsed.type === 'video') {
        setLoadingMsg('Fetching video…')
        const track = await fetchVideoInfo(parsed.videoId)
        addAndNotify([track])
        setInput('')
        setResults([])
      } else if (parsed.type === 'playlist') {
        setLoadingMsg('Loading playlist…')
        const tracks = await fetchPlaylistTracks(parsed.playlistId)
        addAndNotify(tracks)
        setInput('')
        setResults([])
      } else {
        setLoadingMsg('Searching…')
        const found = await searchYouTube(parsed.query, 5)
        setResults(found)
        setLoadingMsg('')
      }
    } catch (e: any) {
      setError(e.message ?? 'Search failed')
    } finally {
      setLoading(false)
      setLoadingMsg('')
    }
  }

  const addAndNotify = (tracks: MusicTrack[]) => {
    if (!tracks.length) { setError('No results found'); return }
    const isFirstTrack = queue.length === 0 || !isThisConv

    if (isFirstTrack) {
      playTrack(tracks[0], conv.id)
      tracks.slice(1).forEach(t => queueTrack(t))
    } else {
      tracks.forEach(t => queueTrack(t))
    }

    const label = tracks.length === 1
      ? tracks[0].title
      : `${tracks[0].title} +${tracks.length - 1} more`

    sendMessage(conv.id, '', 'now_playing', {
      musicData: tracks[0],
      senderName: 'Music',
      senderAvatar: '🎵',
      senderId: 'music',
    })

    if (tracks.length > 1) {
      sendMessage(conv.id, `🎵 Added ${tracks.length} tracks to the queue`, 'system')
    }
  }

  const handleResultPick = (track: MusicTrack) => {
    addAndNotify([track])
    setResults([])
    setInput('')
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Add music */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-2">Add Music</p>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setResults([]); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Search song or paste YouTube URL / playlist"
            className="flex-1 bg-bg-card border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-accent/50"
          />
          <button
            onClick={handleAdd}
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search size={17} className="text-white" />
            )}
          </button>
        </div>

        {loadingMsg && <p className="text-gray-500 text-xs mt-1.5 ml-1">{loadingMsg}</p>}
        {error && <p className="text-moto-red text-xs mt-1.5 ml-1">{error}</p>}

        {!YT_API_KEY || YT_API_KEY === 'YOUR_KEY_HERE' ? (
          <div className="mt-2 bg-accent/10 border border-accent/20 rounded-xl px-3 py-2.5">
            <p className="text-accent text-xs font-semibold mb-1">YouTube API key needed</p>
            <p className="text-gray-400 text-xs">
              Add <span className="font-mono text-white">VITE_YOUTUBE_API_KEY=yourkey</span> to <span className="font-mono text-white">.env</span>
            </p>
            <a
              href="https://console.cloud.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-accent text-xs underline mt-1 inline-block"
            >
              Get free key at console.cloud.google.com →
            </a>
          </div>
        ) : null}
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-2">Results</p>
          <div className="space-y-1.5">
            {results.map(track => (
              <button
                key={track.id}
                onClick={() => handleResultPick(track)}
                className="w-full flex items-center gap-3 bg-bg-card border border-white/5 rounded-xl px-3 py-2.5 text-left hover:border-accent/40 active:bg-white/5 transition-all"
              >
                <img
                  src={track.artworkUrl}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{track.title}</p>
                  <p className="text-gray-400 text-xs truncate">{track.artist}</p>
                </div>
                <Plus size={16} className="text-accent flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Group Radio player */}
      {isThisConv && queue.length > 0 && currentTrack && (
        <div className="px-4 pb-3">
          {/* Listen Along toggle */}
          <div className="flex items-center justify-between mb-3 bg-bg-card border border-white/5 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Headphones size={15} className={isListeningAlong ? 'text-accent' : 'text-gray-500'} />
              <div>
                <p className="text-white text-sm font-semibold leading-tight">Listen Along</p>
                <p className="text-gray-500 text-xs">Hear music on your device</p>
              </div>
            </div>
            <button
              onClick={() => setListeningAlong(!isListeningAlong)}
              className={`w-12 h-6 rounded-full transition-all relative ${isListeningAlong ? 'bg-accent' : 'bg-white/15'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${isListeningAlong ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Now Playing card */}
          <div className="bg-bg-card border border-white/5 rounded-2xl overflow-hidden mb-3">
            <div className="flex gap-3 p-3 items-center">
              <div className="relative flex-shrink-0">
                <img
                  src={currentTrack.artworkUrl}
                  alt={currentTrack.title}
                  className="w-14 h-14 rounded-xl object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.background = '#ff6b3520' }}
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FF0000] rounded-sm flex items-center justify-center">
                  <Youtube size={9} className="text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-accent text-[10px] font-bold uppercase tracking-wider mb-0.5">
                  {isPlaying ? (isListeningAlong ? '▶ Now Playing' : '▶ Playing (muted)') : '⏸ Paused'}
                </p>
                <p className="text-white font-semibold text-sm truncate">{currentTrack.title}</p>
                <p className="text-gray-400 text-xs truncate">{currentTrack.artist}</p>
              </div>
              <span className="text-gray-600 text-xs flex-shrink-0">{musicIndex + 1}/{queue.length}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between px-4 pb-3">
              <button
                onClick={toggleLoop}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  musicLoop ? 'bg-accent/20 text-accent' : 'bg-bg-surface text-gray-500'
                }`}
                title="Loop queue"
              >
                <Repeat size={14} />
              </button>
              <button
                onClick={prevTrack}
                disabled={musicIndex === 0 && !musicLoop}
                className="w-9 h-9 rounded-full bg-bg-surface flex items-center justify-center disabled:opacity-30"
              >
                <SkipBack size={15} className="text-gray-300" />
              </button>
              <button
                onClick={() => isPlaying ? pauseMusic() : resumeMusic()}
                className="w-12 h-12 bg-accent rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-lg"
              >
                {isPlaying
                  ? <Pause size={18} className="text-white" />
                  : <Play size={18} className="text-white ml-0.5" />
                }
              </button>
              <button
                onClick={skipTrack}
                className="w-9 h-9 rounded-full bg-bg-surface flex items-center justify-center"
              >
                <SkipForward size={15} className="text-gray-300" />
              </button>
              <button
                onClick={stopMusic}
                className="w-8 h-8 rounded-full bg-bg-surface flex items-center justify-center"
                title="Stop & clear"
              >
                <X size={14} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Playlist */}
      {isThisConv && queue.length > 0 && results.length === 0 && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold flex items-center gap-1">
              <ListMusic size={11} />Group Playlist · {queue.length} tracks
            </p>
            <button onClick={stopMusic} className="text-gray-600 text-xs flex items-center gap-1">
              <Trash2 size={11} /> Clear
            </button>
          </div>
          <div className="space-y-1">
            {queue.map((t, i) => (
              <div
                key={`${t.id}-${i}`}
                className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 ${
                  i === musicIndex ? 'bg-accent/10 border border-accent/20' : 'bg-bg-card border border-white/5'
                }`}
              >
                <span className="text-gray-600 text-[10px] w-4 text-right flex-shrink-0 tabular-nums">{i + 1}</span>
                <img
                  src={t.artworkUrl}
                  alt=""
                  className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => { playTrack(t, conv.id); useStore.getState().setListeningAlong(true) }}
                >
                  <p className={`text-xs truncate ${i === musicIndex ? 'text-accent font-semibold' : 'text-gray-300'}`}>{t.title}</p>
                  <p className="text-gray-500 text-[10px] truncate">{t.artist}</p>
                </div>
                {i === musicIndex && isPlaying && (
                  <span className="text-accent text-[10px] animate-pulse flex-shrink-0">▶</span>
                )}
                <button
                  onClick={() => removeFromQueue(i)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-gray-600 hover:text-moto-red flex-shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!currentTrack && results.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center">
          <Music size={40} className="text-gray-700 mb-3" />
          <p className="text-gray-500 text-sm font-medium">No music playing</p>
          <p className="text-gray-600 text-xs mt-1">Search for a song or paste a YouTube link above</p>
          <p className="text-gray-600 text-xs mt-0.5">Paste a playlist URL to queue all tracks at once</p>
        </div>
      )}
    </div>
  )
}

// ─── Now Playing Chat Bubble ──────────────────────────────────────────────────

function NowPlayingBubble({ msg }: { msg: ChatMessage }) {
  const playTrack = useStore(s => s.playTrack)
  const isMusicPlaying = useStore(s => s.isMusicPlaying)
  const musicQueue = useStore(s => s.musicQueue)
  const musicIndex = useStore(s => s.musicIndex)
  const t = msg.musicData
  if (!t) return null
  const isThisPlaying = isMusicPlaying && musicQueue[musicIndex]?.id === t.id

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[85%]">
        <div className="flex items-center gap-1.5 mb-1 ml-1">
          <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-bold">🎵 Music</span>
        </div>
        <div className="bg-bg-card border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex gap-3 p-3">
            <div className="relative flex-shrink-0">
              <img
                src={t.artworkUrl}
                alt={t.title}
                className="w-12 h-12 rounded-xl object-cover"
                onError={e => { (e.target as HTMLImageElement).style.background = '#ff6b3520' }}
              />
              {isThisPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                  <span className="text-white text-xs animate-pulse">▶</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-accent text-[10px] font-bold uppercase tracking-wider mb-0.5">Added to queue</p>
              <p className="text-white font-semibold text-sm truncate">{t.title}</p>
              <p className="text-gray-400 text-xs truncate">{t.artist}</p>
            </div>
          </div>
          {!isThisPlaying && (
            <div className="px-3 pb-3">
              <button
                onClick={() => playTrack(t, msg.conversationId)}
                className="w-full py-2 rounded-xl text-sm font-semibold bg-accent text-white flex items-center justify-center gap-2"
              >
                <Play size={13} className="ml-0.5" /> Play Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) {
  const addReaction = useStore(s => s.addReaction)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const QUICK_REACTIONS = ['👍', '🔥', '😂', '🙏', '💯', '🤙']

  const timeStr = (d: Date) =>
    new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  if (msg.type === 'now_playing') return <NowPlayingBubble msg={msg} />

  if (msg.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-gray-500 text-xs bg-bg-card px-3 py-1 rounded-full">{msg.content}</span>
      </div>
    )
  }

  if (msg.type === 'ride_invite' && msg.rideData) {
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
        <div className="max-w-[80%]">
          {!isMe && <p className="text-gray-400 text-xs mb-1 ml-1">{msg.senderName}</p>}
          <div className="bg-accent/10 border border-accent/30 rounded-2xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🏍️</span>
              <div>
                <p className="text-accent text-xs font-bold uppercase tracking-wider">Ride Invite</p>
                <p className="text-white font-semibold text-sm">{msg.rideData.groupName}</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm">📍 {msg.rideData.destination}</p>
            <p className="text-gray-400 text-xs mt-1">🕐 {msg.rideData.departureTime}</p>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 bg-accent text-white text-xs font-bold py-2 rounded-xl">Join Ride</button>
              <button className="flex-1 bg-bg-card text-gray-400 text-xs font-semibold py-2 rounded-xl">Maybe</button>
            </div>
          </div>
          <p className="text-gray-600 text-[10px] mt-1 px-1">{timeStr(msg.timestamp)}</p>
        </div>
      </div>
    )
  }

  if (msg.type === 'location' && msg.locationData) {
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
        <div className="max-w-[75%]">
          {!isMe && <p className="text-gray-400 text-xs mb-1 ml-1">{msg.senderName}</p>}
          <div className="bg-bg-card border border-white/10 rounded-2xl overflow-hidden">
            <div className="bg-bg-surface/50 h-20 flex items-center justify-center">
              <div className="text-center">
                <MapPin size={24} className="text-accent mx-auto mb-1" />
                <p className="text-gray-400 text-xs">View on map</p>
              </div>
            </div>
            <div className="px-3 py-2">
              <p className="text-white text-sm font-medium">{msg.locationData.name ?? 'Location'}</p>
              <p className="text-gray-500 text-xs">{msg.locationData.lat.toFixed(4)}, {msg.locationData.lng.toFixed(4)}</p>
            </div>
          </div>
          <p className="text-gray-600 text-[10px] mt-1 px-1">{timeStr(msg.timestamp)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`max-w-[78%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isMe && <p className="text-gray-400 text-xs mb-1 ml-1">{msg.senderName}</p>}
        <button
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed text-left ${
            isMe ? 'bg-accent text-white rounded-br-md' : 'bg-bg-card text-gray-100 rounded-bl-md'
          }`}
          onClick={() => setShowReactionPicker(v => !v)}
        >
          {msg.content}
        </button>

        {msg.reactions.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {msg.reactions.map(r => (
              <button
                key={r.emoji}
                onClick={() => addReaction(msg.id, r.emoji, 'rider-1')}
                className="flex items-center gap-1 bg-bg-card border border-white/10 rounded-full px-2 py-0.5 text-xs"
              >
                <span>{r.emoji}</span>
                <span className="text-gray-400">{r.userIds.length}</span>
              </button>
            ))}
          </div>
        )}

        {showReactionPicker && (
          <div className="flex gap-1.5 mt-1 bg-bg-card border border-white/10 rounded-2xl px-2 py-1.5 shadow-lg">
            {QUICK_REACTIONS.map(e => (
              <button
                key={e}
                onClick={() => { addReaction(msg.id, e, 'rider-1'); setShowReactionPicker(false) }}
                className="text-lg active:scale-125 transition-transform"
              >
                {e}
              </button>
            ))}
            <button onClick={() => setShowReactionPicker(false)} className="text-gray-500 ml-1">
              <X size={14} />
            </button>
          </div>
        )}

        <p className={`text-gray-600 text-[10px] mt-0.5 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
          {timeStr(msg.timestamp)}
        </p>
      </div>
    </div>
  )
}

// ─── Message View ─────────────────────────────────────────────────────────────

type ConvTab = 'chat' | 'music'

function MessageView({ conv, onBack }: { conv: Conversation; onBack: () => void }) {
  const messages = useStore(s => s.messages.filter(m => m.conversationId === conv.id))
  const sendMessage = useStore(s => s.sendMessage)
  const voiceConvId = useStore(s => s.voiceConvId)
  const joinVoice = useStore(s => s.joinVoice)
  const leaveVoice = useStore(s => s.leaveVoice)
  const groups = useStore(s => s.groups)
  const musicConvId = useStore(s => s.musicConvId)

  const [text, setText] = useState('')
  const [showExtra, setShowExtra] = useState(false)
  const [activeTab, setActiveTab] = useState<ConvTab>('chat')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isInVoice = voiceConvId === conv.id
  const linkedGroup = conv.groupId ? groups.find(g => g.id === conv.groupId) : null
  const hasMusicPlaying = musicConvId === conv.id

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = () => {
    const t = text.trim()
    if (!t) return
    sendMessage(conv.id, t)
    setText('')
    inputRef.current?.focus()
  }

  const handleShareLocation = () => {
    setShowExtra(false)
    navigator.geolocation?.getCurrentPosition(
      pos => sendMessage(conv.id, '', 'location', {
        locationData: { lat: pos.coords.latitude, lng: pos.coords.longitude, name: 'My location' },
      }),
      () => sendMessage(conv.id, '', 'location', {
        locationData: { lat: -8.6705, lng: 115.2126, name: 'Renon, Denpasar' },
      })
    )
  }

  const handleRideInvite = () => {
    setShowExtra(false)
    sendMessage(conv.id, '', 'ride_invite', {
      rideData: {
        groupName: conv.name,
        destination: linkedGroup?.destinationName ?? 'Destination TBD',
        departureTime: 'Sunday 6:00 AM · Renon',
      },
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-white/5 bg-bg-secondary flex-shrink-0">
        <button onClick={onBack} className="text-gray-400 p-1">
          <ChevronLeft size={22} />
        </button>
        <div className="w-9 h-9 rounded-full bg-bg-card flex items-center justify-center text-lg flex-shrink-0">
          {conv.emoji ?? '👥'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{conv.name}</p>
          {conv.type === 'group' && (
            <p className="text-gray-500 text-xs">{conv.participantIds.length} members</p>
          )}
        </div>
        {conv.type === 'group' && (
          <button
            onClick={() => isInVoice ? leaveVoice() : joinVoice(conv.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isInVoice
                ? 'bg-moto-red/20 text-moto-red border border-moto-red/30'
                : 'bg-moto-green/20 text-moto-green border border-moto-green/30'
            }`}
          >
            {isInVoice ? <PhoneOff size={13} /> : <Phone size={13} />}
            {isInVoice ? 'Leave' : 'Voice'}
          </button>
        )}
      </div>

      {/* Chat / Music tab switcher (group only) */}
      {conv.type === 'group' && (
        <div className="flex border-b border-white/5 flex-shrink-0">
          {(['chat', 'music'] as ConvTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-all capitalize ${
                activeTab === tab
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-gray-500'
              }`}
            >
              {tab === 'chat' ? <Send size={13} /> : <Music size={13} />}
              {tab}
              {tab === 'music' && hasMusicPlaying && (
                <span className="w-1.5 h-1.5 rounded-full bg-moto-green animate-pulse" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Voice bar */}
      {isInVoice && activeTab === 'chat' && (
        <div className="px-3 pt-2 flex-shrink-0"><VoiceBar /></div>
      )}

      {/* Content */}
      {activeTab === 'music' ? (
        <div className="flex-1 overflow-y-auto">
          <MusicSection conv={conv} />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} isMe={msg.senderId === 'rider-1'} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Extra actions */}
          {showExtra && (
            <div className="px-4 pb-2 flex gap-2 flex-wrap flex-shrink-0">
              <button
                onClick={handleShareLocation}
                className="flex items-center gap-2 bg-bg-card border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300"
              >
                <MapPin size={15} className="text-accent" /> Share Location
              </button>
              {conv.type === 'group' && (
                <>
                  <button
                    onClick={handleRideInvite}
                    className="flex items-center gap-2 bg-bg-card border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300"
                  >
                    🏍️ Ride Invite
                  </button>
                  <button
                    onClick={() => { setActiveTab('music'); setShowExtra(false) }}
                    className="flex items-center gap-2 bg-bg-card border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300"
                  >
                    <Music size={15} className="text-accent" /> Music
                  </button>
                </>
              )}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-white/5 bg-bg-secondary pb-safe flex-shrink-0">
            <button
              onClick={() => setShowExtra(v => !v)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                showExtra ? 'bg-accent text-white' : 'bg-bg-card text-gray-400'
              }`}
            >
              <Plus size={18} />
            </button>
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Message…"
              className="flex-1 bg-bg-card border border-white/10 rounded-2xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-accent/50"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="w-9 h-9 rounded-full bg-accent flex items-center justify-center disabled:opacity-30 disabled:bg-bg-card flex-shrink-0 transition-all"
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Conversation List ────────────────────────────────────────────────────────

function ConvRow({ conv, onSelect }: { conv: Conversation; onSelect: () => void }) {
  const voiceConvId = useStore(s => s.voiceConvId)
  const musicConvId = useStore(s => s.musicConvId)
  const isMusicPlaying = useStore(s => s.isMusicPlaying)

  const hasVoice = voiceConvId === conv.id
  const hasMusicActive = musicConvId === conv.id && isMusicPlaying
  const last = conv.lastMessage

  const timeLabel = (date?: Date) => {
    if (!date) return ''
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    if (mins < 1440) return `${Math.floor(mins / 60)}h`
    return `${Math.floor(mins / 1440)}d`
  }

  const preview = () => {
    if (!last) return 'No messages'
    if (last.type === 'ride_invite') return '🏍️ Ride invite'
    if (last.type === 'location') return '📍 Location shared'
    if (last.type === 'now_playing') return `🎵 ${last.musicData?.title ?? 'Music added'}`
    if (last.type === 'system') return last.content
    return last.content
  }

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 active:bg-white/8 transition-all text-left"
    >
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-full bg-bg-card flex items-center justify-center text-xl border border-white/5">
          {conv.emoji ?? (conv.type === 'group' ? '👥' : '👤')}
        </div>
        {hasVoice && (
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-moto-green rounded-full flex items-center justify-center">
            <Mic size={9} className="text-bg-primary" />
          </span>
        )}
        {hasMusicActive && !hasVoice && (
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
            <Music size={9} className="text-white" />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-white text-sm font-semibold truncate">{conv.name}</p>
          <span className="text-gray-500 text-xs flex-shrink-0 ml-2">{timeLabel(last?.timestamp)}</span>
        </div>
        <p className="text-gray-500 text-xs truncate">{preview()}</p>
      </div>

      {conv.unreadCount > 0 && (
        <span className="flex-shrink-0 min-w-[20px] h-5 bg-accent rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1.5">
          {conv.unreadCount}
        </span>
      )}
    </button>
  )
}

// ─── New Group Modal ──────────────────────────────────────────────────────────

function NewGroupModal({ onClose }: { onClose: () => void }) {
  const createGroup = useStore(s => s.createGroup)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏍️')
  const EMOJIS = ['🏍️', '🌊', '🌋', '⚡', '🔥', '🎯', '🚀', '🌴', '💨', '🏆', '☀️', '🤙']

  const handle = () => {
    if (!name.trim()) return
    createGroup(name, emoji, '')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-secondary rounded-t-3xl p-5 w-full max-w-lg animate-slide-up pb-safe">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">New Group</h3>
          <button onClick={onClose} className="text-gray-400"><X size={20} /></button>
        </div>
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
          {EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`w-10 h-10 rounded-xl text-xl flex-shrink-0 transition-all ${
                emoji === e ? 'bg-accent/20 ring-2 ring-accent' : 'bg-bg-card'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Group name"
          className="w-full bg-bg-card border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent text-sm mb-4"
          autoFocus
        />
        <button
          onClick={handle}
          disabled={!name.trim()}
          className="w-full bg-accent text-white font-semibold py-3 rounded-xl disabled:opacity-40"
        >
          Create Group
        </button>
      </div>
    </div>
  )
}

// ─── Main Chat Panel ──────────────────────────────────────────────────────────

export default function ChatPanel() {
  const conversations = useStore(s => s.conversations)
  const activeConversationId = useStore(s => s.activeConversationId)
  const setActiveConversation = useStore(s => s.setActiveConversation)
  const voiceConvId = useStore(s => s.voiceConvId)
  const [showNewGroup, setShowNewGroup] = useState(false)

  const groupConvs = conversations.filter(c => c.type === 'group')
  const dmConvs = conversations.filter(c => c.type === 'dm')
  const totalUnread = conversations.reduce((n, c) => n + c.unreadCount, 0)

  const activeConv = conversations.find(c => c.id === activeConversationId)

  if (activeConv) {
    return (
      <div className="h-full">
        <MessageView conv={activeConv} onBack={() => setActiveConversation(null)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-white font-bold text-xl">Chat</h2>
          {totalUnread > 0 && (
            <span className="bg-accent text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center">
              {totalUnread}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowNewGroup(true)}
          className="flex items-center gap-1.5 bg-accent text-white text-sm font-semibold px-3 py-2 rounded-xl"
        >
          <Plus size={14} /> New Group
        </button>
      </div>

      {/* Voice bar if active outside a conversation */}
      {voiceConvId && <VoiceBar />}

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-2 pb-1">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Group Channels</p>
        </div>
        {groupConvs.map(conv => (
          <ConvRow key={conv.id} conv={conv} onSelect={() => setActiveConversation(conv.id)} />
        ))}

        <div className="px-4 pt-4 pb-1">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Direct Messages</p>
        </div>
        {dmConvs.map(conv => (
          <ConvRow key={conv.id} conv={conv} onSelect={() => setActiveConversation(conv.id)} />
        ))}
        {dmConvs.length === 0 && (
          <p className="text-gray-600 text-sm px-4 py-2">No direct messages yet</p>
        )}
        <div className="h-4" />
      </div>

      {showNewGroup && <NewGroupModal onClose={() => setShowNewGroup(false)} />}
    </div>
  )
}
