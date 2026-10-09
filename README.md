# ELITE — Printed Shirts Store

A black-and-white, minimal e-commerce site for printed shirts. It has a customer storefront and an admin panel.

- **Frontend:** React 19, Vite, React Router
- **Backend:** Express 5 with a JSON-file database (`data/db.json`) and local media uploads (`data/uploads/`)

## Run it locally

```bash
pnpm install
pnpm dev              # storefront + API on http://localhost:5173
```

Admin panel: http://localhost:5173/admin. Local demo login: `admin` / `admin123`.

Locally, data is stored in `./data` (JSON files plus uploads). On Vercel it is stored in Vercel Blob.

## Deploying on Vercel

The site is configured for Vercel (`vercel.json`):

- `dist/` is served as a static site from Vercel's CDN.
- `api/[...path].js` is a single Vercel Function that runs the Express API.
- Data is stored in **Vercel Blob**. The product catalog and settings are one JSON document, and each order is its own document. Writes use ETag checks so two checkouts can't overwrite each other's stock changes.

Project environment variables:

| Variable                | Purpose                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| `ADMIN_USERNAME`        | Admin login username                                             |
| `ADMIN_PASSWORD`        | Admin login password                                             |
| `AUTH_SECRET`           | Random string used to sign admin sessions                        |
| `DATA_PREFIX`           | Secret folder name in Blob for the catalog and orders. Keep it private. |
| `BLOB_READ_WRITE_TOKEN` | Added automatically when the Blob store is connected             |

Redeploy after changing environment variables.

### Keeping CPU and bandwidth low

- **Images:** every image in `public/images` ships as AVIF and WebP in several widths (`pnpm images` regenerates them) and is served with `srcset`, so phones download only a few KB. Vercel Image Optimization is not used, so images cost nothing at runtime.
- **Admin uploads:** photos are resized and converted to WebP in the browser (a 2000px main image plus an 800px version) before upload. They go straight from the browser to Vercel Blob, so the function never handles file data.
- **Videos:** a video starts downloading only when it scrolls near the screen and pauses when it scrolls away. Instagram and YouTube embeds load only after a visitor clicks play. Upload videos at 720p and under about 15 MB.
- **API caching:** `GET /api/store` is cached at Vercel's CDN for 60 seconds, with stale-while-revalidate. Most visits never run the function, and admin changes show up on the storefront within about a minute.
- **Static assets:** hashed JS and CSS are cached for a year; images are cached for 30 days.
- **Bundle:** the admin panel and the Blob upload client are separate chunks that shoppers never download.

## Running on your own server

```bash
pnpm build
ADMIN_USERNAME=owner ADMIN_PASSWORD='strong-password' AUTH_SECRET='long-random-string' PORT=3000 pnpm start
```

Without `BLOB_READ_WRITE_TOKEN`, data is stored in `DATA_DIR` (default `./data`), so the server needs a persistent disk.

## Storefront

- A full-screen hero with a large background image, headline and call to action
- A featured product grid that shows the back of the shirt on hover
- An **"In motion" section with two videos**. Each video can be an uploaded MP4/WEBM, a direct video URL, an Instagram reel/post link or a YouTube link. Until one is set, the poster image links to the Instagram profile.
- Shop page with category filters and sorting
- Product page with a gallery, a size picker that knows each size's stock, and details
- A slide-out bag with a free-shipping progress bar
- Checkout (cash on delivery or bank transfer) and an order confirmation page
- About page

## Admin panel (`/admin`)

- **Dashboard:** revenue, order count, pending orders, units sold, a 14-day revenue chart, recent orders and low-stock alerts
- **Orders:** filter and search orders, see order details, change status (cancelling puts the items back in stock), add internal notes
- **Products:** create, edit and delete products; upload and reorder images; set stock per size, sale price, featured flag and visibility
- **Homepage & videos:** hero image and text, the two videos (upload or link), poster images, About text
- **Settings:** store name, announcement bar, currency, shipping rate and free-shipping threshold, contact email, Instagram URL, and a reset to demo data

## Replacing the placeholder content

The images in `public/images/` are generated black-and-white mock-ups. To replace them:

1. Go to **Admin → Homepage & videos** and upload a real hero photo plus the two videos (or paste the Instagram reel links).
2. Go to **Admin → Products** and upload real product photos. Use a 4:5 ratio; front first, back second.

## Not included yet

- **Online card payments.** Checkout takes orders as cash on delivery or bank transfer. To accept cards, connect a provider such as Stripe or Razorpay in `POST /api/orders`.
- **Order emails.** Nothing is sent to customers or the store yet.
- **Scale.** The Blob/JSON storage suits a small shop (up to a few thousand orders). Move to a database such as Neon Postgres as volume grows.
