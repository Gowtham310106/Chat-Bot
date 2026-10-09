import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import Img from '../components/Img'

export default function About() {
  const { settings } = useStore()
  return (
    <div className="container about">
      <p className="eyebrow">About {settings.storeName}</p>
      <h1>{settings.about?.title}</h1>
      <div className="about-grid">
        <Img src="/images/editorial-1.jpg" sizes="(max-width: 860px) 100vw, 50vw" />
        <div>
          <p className="lead">{settings.about?.body}</p>
          <p className="muted">{settings.tagline}</p>
          <Link to="/shop" className="btn">Shop the collection</Link>
        </div>
      </div>
    </div>
  )
}
