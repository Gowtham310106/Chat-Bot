import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import VideoPlayer from '../components/VideoPlayer'
import { ArrowIcon, InstagramIcon } from '../components/Icons'
import { useStore } from '../context/StoreContext'
import Img from '../components/Img'

const MARQUEE = ['Heavyweight cotton', 'Screen printed', 'Small batches', 'Bold prints', 'Made to train in']

export default function Home() {
  const { settings, products } = useStore()
  const { hero, videos = [], videosSection, about } = settings
  const featured = products.filter((p) => p.featured).slice(0, 4)
  const latest = (featured.length ? featured : products).slice(0, 4)
  const handle = settings.instagramUrl?.match(/instagram\.com\/([^/?#]+)/)?.[1]

  return (
    <>
      <section className="hero">
        {hero.image && <Img className="hero-img" src={hero.image} priority />}
        <div className="hero-shade" />
        <div className="hero-content">
          {hero.eyebrow && <p className="eyebrow">{hero.eyebrow}</p>}
          <h1>{hero.title}</h1>
          {hero.subtitle && <p className="hero-sub">{hero.subtitle}</p>}
          <div className="hero-ctas">
            <Link to={hero.ctaLink || '/shop'} className="btn btn-light">{hero.ctaLabel || 'Shop now'}</Link>
            {videos.length > 0 && <a href="#in-motion" className="btn btn-ghost-light">Watch the film</a>}
          </div>
        </div>
        <span className="hero-scroll">Scroll</span>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...MARQUEE, ...MARQUEE, ...MARQUEE].map((t, i) => <span key={i}>{t}<i>✦</i></span>)}
        </div>
      </div>

      <section className="section container">
        <div className="section-head">
          <h2>Featured</h2>
          <Link to="/shop" className="text-link">View all <ArrowIcon width={16} /></Link>
        </div>
        <div className="product-grid">
          {latest.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {videos.length > 0 && (
        <section className="section videos-section" id="in-motion">
          <div className="container videos-layout">
            <div className="videos-intro">
              <p className="eyebrow">Film</p>
              <h2>{videosSection?.title}</h2>
              <p className="muted-light">{videosSection?.subtitle}</p>
              {settings.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noreferrer" className="text-link light">
                  <InstagramIcon width={16} /> {handle ? `@${handle}` : 'Instagram'}
                </a>
              )}
            </div>
            {videos.map((v) => (
              <figure className="video-card" key={v.id}>
                <VideoPlayer video={v} fallbackLink={settings.instagramUrl} />
                <figcaption>
                  <strong>{v.title}</strong>
                  {v.caption && <span>{v.caption}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="section container editorial">
        <Link to="/shop?category=Typography" className="editorial-tile">
          <Img src="/images/editorial-2.jpg" sizes="(max-width: 860px) 100vw, 50vw" />
          <div className="editorial-label"><span>Typography</span><ArrowIcon /></div>
        </Link>
        <Link to="/shop?category=Graphic" className="editorial-tile dark">
          <Img src="/images/editorial-1.jpg" sizes="(max-width: 860px) 100vw, 50vw" />
          <div className="editorial-label"><span>Graphic</span><ArrowIcon /></div>
        </Link>
      </section>

      {about?.title && (
        <section className="section container statement">
          <h2>{about.title}</h2>
          <p>{about.body}</p>
          <Link to="/about" className="text-link">Our story <ArrowIcon width={16} /></Link>
        </section>
      )}
    </>
  )
}
