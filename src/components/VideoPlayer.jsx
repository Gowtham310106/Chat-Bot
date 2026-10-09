import { useEffect, useRef, useState } from 'react'
import Img from './Img'
import { PlayIcon, SoundOffIcon, SoundOnIcon } from './Icons'

// Turns an Instagram post/reel or YouTube link into an embeddable URL.
function embedUrl(type, src) {
  if (!src) return null
  try {
    const u = new URL(src)
    if (type === 'instagram') {
      const m = u.pathname.match(/\/(p|reel|reels|tv)\/([^/]+)/)
      return m ? `https://www.instagram.com/${m[1] === 'reels' ? 'reel' : m[1]}/${m[2]}/embed` : null
    }
    if (type === 'youtube') {
      const id = u.hostname.includes('youtu.be') ? u.pathname.slice(1)
        : u.pathname.startsWith('/shorts/') ? u.pathname.split('/')[2]
        : u.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&autoplay=1` : null
    }
  } catch { /* invalid URL */ }
  return null
}

// Only downloads the video once it's near the screen, and pauses it when scrolled away,
// so visitors who never reach the section don't spend any bandwidth on it.
function LazyVideo({ src, poster }) {
  const ref = useRef(null)
  const [near, setNear] = useState(false)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) { setNear(true); return }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNear(true)
        el.play?.().catch(() => {})
      } else {
        el.pause?.()
      }
    }, { rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className="video-frame">
      <video ref={ref} src={near ? src : undefined} poster={poster || undefined} muted loop playsInline autoPlay preload="none" />
      <button
        className="video-sound"
        onClick={() => { ref.current.muted = !muted; setMuted(!muted) }}
        aria-label={muted ? 'Unmute video' : 'Mute video'}
      >
        {muted ? <SoundOffIcon /> : <SoundOnIcon />}
      </button>
    </div>
  )
}

function Poster({ poster, label }) {
  return (
    <>
      {poster && <Img src={poster} sizes="(max-width: 1100px) 50vw, 30vw" />}
      <span className="play-badge" aria-hidden="true"><PlayIcon /></span>
      <span className="sr-only">{label}</span>
    </>
  )
}

export default function VideoPlayer({ video, fallbackLink }) {
  const [playing, setPlaying] = useState(false)

  if ((video.type === 'upload' || video.type === 'url') && video.src) {
    return <LazyVideo src={video.src} poster={video.poster} />
  }

  // Embeds are heavy (hundreds of KB of third-party scripts), so only load them on click.
  const embed = embedUrl(video.type, video.src)
  if (embed) {
    return playing ? (
      <div className="video-frame is-embed">
        <iframe src={embed} title={video.title || 'Video'} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
      </div>
    ) : (
      <button type="button" className="video-frame is-poster" onClick={() => setPlaying(true)}>
        <Poster poster={video.poster} label={`Play ${video.title || 'video'}`} />
      </button>
    )
  }

  // No video configured yet: show the poster and send people to the feed.
  if (fallbackLink) {
    return (
      <a className="video-frame is-poster" href={fallbackLink} target="_blank" rel="noreferrer">
        <Poster poster={video.poster} label="Watch on Instagram" />
      </a>
    )
  }
  return <div className="video-frame is-poster"><Poster poster={video.poster} label="" /></div>
}
