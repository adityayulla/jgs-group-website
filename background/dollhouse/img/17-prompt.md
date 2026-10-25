# Titik 17 — Kamar mandi lantai 2 (Okina 61)

Gambar acuan: `17-acuan.png` (dari `/background/dollhouse/?kamera=17`, kamera di ujung depan kamar mandi x 0,4 / z 2,2 setinggi 1,5 m dari lantai 2, memandang ke dalam: ruang sempit ±0,9 × 2 m, wastafel di sisi kanan, dinding ujung).

**Jalur output:** `/Users/adityasamawi/Projects/JGS-Group/background/dollhouse/img/17.webp` (lanskap 3:2, lebar 1600 px). ChatGPT menulis langsung ke jalur ini. Setelah ada, ganti `gambar` titik 17 di `dollhouse.json` menjadi `img/17.webp`.

Catatan: model kamar mandinya hanya kotak berubin tanpa sanitair kecuali wastafel, jadi prompt meminta ChatGPT melengkapi toilet dan shower pada bentuk ruang yang sama.

## Prompt untuk ChatGPT (unggah gambar acuan, lalu tempel teks ini)

```
Style guide (same for every image of this house): modern minimalist, light grey 60x60 cm granite floor, matte white walls, dark walnut doors and window frames, slim black metal accents, light oak furniture, white and warm grey textiles, one green plant per room, bright natural daylight, 24 mm lens, 3:2 landscape, photoreal, no people, no text, no watermark.

Photorealistic interior render of a narrow upstairs bathroom, modern minimalist Indonesian tropical style.

Use the attached 3D reference image for composition: keep the camera position and angle, the narrow proportions (about 0.9 m wide and 2 m deep), the tiled walls on both sides, and the end wall ahead exactly as shown. Replace all materials and add realistic bathroom fixtures.

Scene: a compact bathroom with large-format light grey matte porcelain tiles on the floor and walls, a warm white ceiling with one slim recessed light. On the right wall a wall-hung light oak vanity with a white ceramic basin, a slim black mixer tap and a frameless round mirror with a black-framed wall lamp above. At the far end a wall-hung white toilet with a black flush plate, and a slim black rain shower on the end wall with a clear glass panel separating the shower zone. A small black wall shelf with a folded white towel and a tiny plant.

Lighting: soft daylight from a small window behind the camera, warm recessed light, subtle reflections on the tiles. Clean, calm, uncluttered.

Output: one image, 3:2 landscape, 1600x1067 px, WebP format. Save it directly to this path on my Mac:
/Users/adityasamawi/Projects/JGS-Group/background/dollhouse/img/17.webp
```
