import { useRef, useState } from 'react'
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
      return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : null
    }
  } catch { /* invalid URL */ }
  return null
}

export default function VideoPlayer({ video, fallbackLink }) {
  const ref = useRef(null)
  const [muted, setMuted] = useState(true)

  if (video.type === 'upload' || video.type === 'url') {
    if (video.src) {
      return (
        <div className="video-frame">
          <video ref={ref} src={video.src} poster={video.poster || undefined} autoPlay muted loop playsInline preload="metadata" />
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
  }

  const embed = embedUrl(video.type, video.src)
  if (embed) {
    return (
      <div className="video-frame is-embed">
        <iframe src={embed} title={video.title || 'Video'} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
      </div>
    )
  }

  // No video configured yet: show the poster and send people to the feed.
  const Wrapper = fallbackLink ? 'a' : 'div'
  return (
    <Wrapper className="video-frame is-poster" {...(fallbackLink ? { href: fallbackLink, target: '_blank', rel: 'noreferrer' } : {})}>
      {video.poster && <img src={video.poster} alt="" loading="lazy" />}
      <span className="play-badge"><PlayIcon /></span>
    </Wrapper>
  )
}
