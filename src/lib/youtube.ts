import type { MusicTrack } from '../types'

export const YT_API_KEY = (import.meta.env.VITE_YOUTUBE_API_KEY ?? '') as string

const BASE = 'https://www.googleapis.com/youtube/v3'

function cleanTitle(raw: string) {
  return raw
    .replace(/\s*\(Official.*?\)/gi, '')
    .replace(/\s*\[Official.*?\]/gi, '')
    .replace(/\s*\(Audio\)/gi, '')
    .replace(/\s*\(Lyrics?\)/gi, '')
    .replace(/\s*\|.*$/, '')
    .trim()
}

function cleanArtist(raw: string) {
  return raw.replace(/ - Topic$/, '').replace(/VEVO$/i, '').trim()
}

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0]
    return u.searchParams.get('v')
  } catch {
    return null
  }
}

function extractPlaylistId(url: string): string | null {
  try {
    return new URL(url).searchParams.get('list')
  } catch {
    return null
  }
}

export function parseYouTubeInput(input: string): { type: 'video'; videoId: string } | { type: 'playlist'; playlistId: string } | { type: 'search'; query: string } {
  const trimmed = input.trim()
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    const playlistId = extractPlaylistId(trimmed)
    if (playlistId) return { type: 'playlist', playlistId }
    const videoId = extractVideoId(trimmed)
    if (videoId) return { type: 'video', videoId }
  }
  return { type: 'search', query: trimmed }
}

export async function fetchVideoInfo(videoId: string): Promise<MusicTrack> {
  const url = `${BASE}/videos?part=snippet,contentDetails&id=${videoId}&key=${YT_API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  const item = data.items?.[0]
  if (!item) throw new Error('Video not found')
  return itemToTrack(item)
}

export async function fetchPlaylistTracks(playlistId: string, maxItems = 50): Promise<MusicTrack[]> {
  const tracks: MusicTrack[] = []
  let pageToken = ''

  while (tracks.length < maxItems) {
    const params = new URLSearchParams({
      part: 'snippet',
      playlistId,
      maxResults: '50',
      key: YT_API_KEY,
      ...(pageToken ? { pageToken } : {}),
    })
    const res = await fetch(`${BASE}/playlistItems?${params}`)
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)

    for (const item of data.items ?? []) {
      const vid = item.snippet?.resourceId?.videoId
      if (!vid || vid === 'deleted' || item.snippet?.title === 'Private video') continue
      tracks.push({
        id: vid,
        title: cleanTitle(item.snippet.title),
        artist: cleanArtist(item.snippet.videoOwnerChannelTitle ?? item.snippet.channelTitle ?? ''),
        album: item.snippet.playlistId ?? '',
        artworkUrl: item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.default?.url ?? '',
        previewUrl: '',
        durationMs: 0,
        source: 'youtube',
      })
    }

    pageToken = data.nextPageToken ?? ''
    if (!pageToken || tracks.length >= maxItems) break
  }

  return tracks
}

export async function searchYouTube(query: string, limit = 5): Promise<MusicTrack[]> {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    videoCategoryId: '10',
    maxResults: String(limit),
    key: YT_API_KEY,
  })
  const res = await fetch(`${BASE}/search?${params}`)
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return (data.items ?? []).map((item: any): MusicTrack => ({
    id: item.id.videoId,
    title: cleanTitle(item.snippet.title),
    artist: cleanArtist(item.snippet.channelTitle),
    album: '',
    artworkUrl: item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.default?.url ?? '',
    previewUrl: '',
    durationMs: 0,
    source: 'youtube',
  }))
}

function itemToTrack(item: any): MusicTrack {
  return {
    id: item.id,
    title: cleanTitle(item.snippet.title),
    artist: cleanArtist(item.snippet.channelTitle),
    album: '',
    artworkUrl: item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.default?.url ?? '',
    previewUrl: '',
    durationMs: 0,
    source: 'youtube',
  }
}
