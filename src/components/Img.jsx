import manifest from '../lib/image-manifest.json'

// Images uploaded through the admin are stored as <id>.webp plus a smaller <id>-800.webp.
const UPLOADED = /\/(img[0-9a-f]{16})\.webp$/

// Responsive image: serves AVIF/WebP at the right width for the screen instead of one large file.
export default function Img({ src, alt = '', sizes = '100vw', className, priority = false, ...rest }) {
  if (!src) return null
  const common = { alt, className, loading: priority ? 'eager' : 'lazy', decoding: 'async', ...(priority ? { fetchPriority: 'high' } : {}), ...rest }

  const entry = manifest[src]
  if (entry) {
    const base = src.replace(/\.(jpe?g|png)$/i, '')
    const set = (ext) => entry.w.map((w) => `${base}-${w}.${ext} ${w}w`).join(', ')
    const largest = entry.w[entry.w.length - 1]
    return (
      <picture>
        <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
        <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
        <img src={src} width={largest} height={Math.round(largest / entry.ratio)} {...common} />
      </picture>
    )
  }

  if (UPLOADED.test(src)) {
    return <img src={src} srcSet={`${src.replace(/\.webp$/, '-800.webp')} 800w, ${src} 2000w`} sizes={sizes} {...common} />
  }

  return <img src={src} {...common} />
}
