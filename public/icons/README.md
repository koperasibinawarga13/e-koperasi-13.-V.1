Place your PWA icon source image in this folder (e.g. `source.png`).

Recommended source: square PNG or SVG, at least 1024×1024.

Run the provided helper script from the project root to generate all required sizes:

```bash
bash scripts/generate-pwa-icons.sh public/icons/source.png
```

This will output:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png` (maskable)
- `icon-384x384.png`
- `icon-512x512.png` (maskable)

If you prefer a GUI, use https://app-manifest.firebaseapp.com/ or https://realfavicongenerator.net/ to generate platform-specific icons.