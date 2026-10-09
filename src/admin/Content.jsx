import VideoPlayer from '../components/VideoPlayer'
import MediaInput from './MediaInput'
import useSettingsForm from './useSettingsForm'

const VIDEO_TYPES = {
  none: 'Not set (shows poster, links to Instagram)',
  upload: 'Uploaded video file',
  url: 'Direct video URL (.mp4 / .webm)',
  instagram: 'Instagram reel / post link',
  youtube: 'YouTube link',
}

export default function Content() {
  const { form, update, save, status } = useSettingsForm()
  if (!form) return <div className="admin-page">{status.error ? <p className="form-error">{status.error}</p> : <span className="loader" />}</div>

  const setHero = (patch) => update((f) => { Object.assign(f.hero, patch); return f })
  const setVideo = (i, patch) => update((f) => { Object.assign(f.videos[i], patch); return f })

  return (
    <form className="admin-page" onSubmit={save}>
      <div className="admin-head">
        <h1>Homepage & videos</h1>
        <button className="btn" disabled={status.saving}>{status.saving ? 'Saving…' : status.saved ? 'Saved ✓' : 'Save changes'}</button>
      </div>
      {status.error && <p className="form-error" role="alert">{status.error}</p>}

      <section className="panel">
        <h2>Hero</h2>
        <div className="hero-preview" style={{ backgroundImage: form.hero.image ? `url(${form.hero.image})` : undefined }}>
          <div>
            <small>{form.hero.eyebrow}</small>
            <strong>{form.hero.title}</strong>
          </div>
        </div>
        <MediaInput label="Hero image" value={form.hero.image} onChange={(image) => setHero({ image })} hint="Full-bleed background. Use a wide, high-resolution photo (at least 2000px wide)." />
        <div className="form-grid">
          <label className="field"><span>Eyebrow</span><input value={form.hero.eyebrow} onChange={(e) => setHero({ eyebrow: e.target.value })} /></label>
          <label className="field"><span>Button label</span><input value={form.hero.ctaLabel} onChange={(e) => setHero({ ctaLabel: e.target.value })} /></label>
          <label className="field span-2"><span>Headline <em>(new line = line break)</em></span><textarea rows={2} value={form.hero.title} onChange={(e) => setHero({ title: e.target.value })} /></label>
          <label className="field span-2"><span>Subtitle</span><textarea rows={2} value={form.hero.subtitle} onChange={(e) => setHero({ subtitle: e.target.value })} /></label>
          <label className="field"><span>Button link</span><input value={form.hero.ctaLink} onChange={(e) => setHero({ ctaLink: e.target.value })} /></label>
        </div>
      </section>

      <section className="panel">
        <h2>Videos section</h2>
        <div className="form-grid">
          <label className="field"><span>Section title</span><input value={form.videosSection.title} onChange={(e) => update((f) => { f.videosSection.title = e.target.value; return f })} /></label>
          <label className="field"><span>Section subtitle</span><input value={form.videosSection.subtitle} onChange={(e) => update((f) => { f.videosSection.subtitle = e.target.value; return f })} /></label>
        </div>
        <div className="video-editors">
          {form.videos.map((v, i) => (
            <div key={v.id} className="video-editor">
              <div className="video-editor-preview"><VideoPlayer video={v} /></div>
              <div className="stack">
                <h3>Video {i + 1}</h3>
                <label className="field"><span>Title</span><input value={v.title} onChange={(e) => setVideo(i, { title: e.target.value })} /></label>
                <label className="field"><span>Caption</span><input value={v.caption} onChange={(e) => setVideo(i, { caption: e.target.value })} /></label>
                <label className="field">
                  <span>Source</span>
                  <select value={v.type} onChange={(e) => setVideo(i, { type: e.target.value, src: e.target.value === v.type ? v.src : '' })}>
                    {Object.entries(VIDEO_TYPES).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                  </select>
                </label>
                {v.type === 'upload' && (
                  <MediaInput label="Video file" kind="video" accept="video/mp4,video/webm,video/quicktime" value={v.src} onChange={(src) => setVideo(i, { src })} hint="MP4 recommended. Vertical (9:16) looks best." />
                )}
                {['url', 'instagram', 'youtube'].includes(v.type) && (
                  <label className="field">
                    <span>Link</span>
                    <input value={v.src} placeholder={v.type === 'instagram' ? 'https://www.instagram.com/reel/…' : 'https://…'} onChange={(e) => setVideo(i, { src: e.target.value })} />
                  </label>
                )}
                <MediaInput label="Poster image" value={v.poster} onChange={(poster) => setVideo(i, { poster })} hint="Shown before the video loads." />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>About</h2>
        <label className="field"><span>Heading</span><input value={form.about.title} onChange={(e) => update((f) => { f.about.title = e.target.value; return f })} /></label>
        <label className="field"><span>Text</span><textarea rows={4} value={form.about.body} onChange={(e) => update((f) => { f.about.body = e.target.value; return f })} /></label>
      </section>
    </form>
  )
}
