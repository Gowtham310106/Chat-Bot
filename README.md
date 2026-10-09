# ELITE — Printed Shirts Store

A black-and-white, minimal e-commerce site for printed shirts. It has a customer storefront and an admin panel.

- **Frontend:** React 19, Vite, React Router
- **Backend:** Express 5 with a JSON-file database (`data/db.json`) and local media uploads (`data/uploads/`)

## Run it

```bash
pnpm install
pnpm dev              # storefront + API on http://localhost:5173
```

Admin panel: http://localhost:5173/admin. The demo password is `admin123`.

For production:

```bash
pnpm build
ADMIN_PASSWORD='choose-a-strong-one' PORT=3000 pnpm start
```

| Env var          | Default     | Purpose                                   |
| ---------------- | ----------- | ----------------------------------------- |
| `ADMIN_PASSWORD` | `admin123`  | Admin login. **Set this before going live.** |
| `PORT`           | `3000`      | HTTP port for `pnpm start`                |
| `DATA_DIR`       | `./data`    | Where the database and uploads are stored |

The server writes to `DATA_DIR`, so host it somewhere with a persistent disk (a VPS, Render or Railway with a volume, etc.). Serverless hosts with read-only filesystems won't keep the data.

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
- **Scale.** The JSON-file database suits a small shop. Move to Postgres or SQLite as volume grows.
