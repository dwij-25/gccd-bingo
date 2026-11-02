# 🌐 Embedding GCCD Bingo into Your Main Website

You can integrate GCCD Bingo into your official community portal in two ways:
1. **Responsive Iframe Embed** (embedded directly into an existing event agenda or activities page)
2. **Dedicated Subdomain** (e.g., `https://bingo.gccdcommunity.org`)

---

## Method 1: Responsive Iframe Embed

Add the following snippet directly into your main website's HTML/React template:

```html
<!-- Container with 100% width and responsive height -->
<div class="gccd-bingo-embed-wrapper" style="width: 100%; max-width: 960px; margin: 0 auto; min-height: 850px; overflow: hidden; border-radius: 24px; box-shadow: 0 12px 36px rgba(0,0,0,0.15);">
  <iframe
    id="gccd-bingo-frame"
    src="https://bingo.yourcommunity.com"
    style="width: 100%; height: 950px; border: none; display: block;"
    title="GCCD Interactive Photo Bingo"
    allow="camera; microphone; clipboard-write;"
    loading="lazy"
  ></iframe>
</div>

<script>
  // Optional: Auto-resize iframe based on mobile viewport
  window.addEventListener('resize', function() {
    const frame = document.getElementById('gccd-bingo-frame');
    if (frame) {
      if (window.innerWidth < 640) {
        frame.style.height = '1100px';
      } else {
        frame.style.height = '950px';
      }
    }
  });
</script>
```

### Server Configuration for Iframe Embedding:
In `apps/api/src/config.ts` and `apps/api/src/index.ts`, the backend is already configured with `frameguard: false` in Helmet and accepts your main website's origin in `ALLOWED_ORIGINS`:
```env
ALLOWED_ORIGINS=https://mycommunitywebsite.com,https://gccd.gdg.community
```

---

## Method 2: Dedicated Subdomain (Recommended for Best Mobile Experience)

1. Set up a CNAME record in your DNS provider:
   - **Host / Name**: `bingo`
   - **Value / Target**: `cname.vercel-dns.com` (or your host)
2. In Vercel / Netlify, add `bingo.yourcommunity.com` under Project Domains.
3. Add a prominent navigation link or QR code on your event badges:
   ```html
   <a href="https://bingo.yourcommunity.com" class="btn-bingo">
     🎉 Play GCCD Photo Bingo
   </a>
   ```
