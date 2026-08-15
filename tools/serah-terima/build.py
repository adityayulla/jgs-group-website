"""Kurasi + kompres arsip serah terima → aset situs utama.

Keluaran:
  JGS-Group/assets/img/serah-terima/<slug>.webp     (1200px, untuk lightbox)
  JGS-Group/assets/img/serah-terima/<slug>-t.webp   (480px, untuk grid)
  JGS-Group/assets/data/serah-terima-arsip.json     (manifest)
"""
from __future__ import annotations
import json, pathlib, re, sys, collections
from PIL import Image

RAW = pathlib.Path("raw")
OUT_IMG = pathlib.Path("/Users/adityasamawi/Projects/JGS-Group/assets/img/serah-terima")
OUT_DATA = pathlib.Path("/Users/adityasamawi/Projects/JGS-Group/assets/data")

# Foto yang dibuang: orang tidak terlihat, bukan momen serah terima,
# atau framing-nya tidak terbaca sebagai foto keluarga.
DROP = {
    "kawa-village__hana-14", "kawa-village__hana-3", "kawa-village__mizu-18",
    "kawa-village__wa-a10", "kawa-village__mizu-3", "kawa-village__mizu-11",
    "kawa-village__yama-3", "kawa-village__yama-9",
    "royal-mansion__adi-07", "royal-mansion__adi-26",
    "tentrem-jiwo__tj-2", "tentrem-jiwo__tj-6",
}

# Foto terkuat — dipakai mengisi strip "5 terakhir" selama antrean
# dashboard masih kosong. Urutan di sini = urutan tampil.
FEATURED = [
    "kawa-village__kumo-1-2", "kawa-village__hana-15", "kawa-village__yama-20",
    "kawa-village__mizu-17", "royal-mansion__adi-09", "kawa-village__kumo-15",
    "kawa-village__hana-8", "kawa-living__kl-1", "royal-mansion__adi-20",
    "kawa-village__yama-17", "kawa-village__mizu-8", "tentrem-jiwo__tj-7",
    "kawa-village__kumo-7", "kawa-village__wa-a11", "royal-mansion__adi-23",
    "kawa-village__mizu-14a", "kawa-village__yama-1", "kawa-living__kl-3",
]

# Nama pembeli TIDAK ditampilkan (keputusan Direktur 15 Agu).
# Label kartu = nama tipe + nomor unit, mis. "Yama 20", "Adiluhung 12".

PROJECTS = {
    "kawa-village":  {"name": "Kawa Village",  "order": 2},
    "royal-mansion": {"name": "Royal Mansion", "order": 3},
    "kawa-living":   {"name": "Kawa Living",   "order": 1},
    "tentrem-jiwo":  {"name": "Tentrem Jiwo",  "order": 4},
    "tentrem-bhumi": {"name": "Tentrem Bhumi", "order": 5},
}

# Prefiks berkas → nama tipe rumah yang sebenarnya.
TYPE_LABEL = {
    "yama": "Yama", "hana": "Hana", "mizu": "Mizu",
    "kumo": "Kumo", "adi": "Adiluhung",
}


def unit_label(slug_label: str) -> str | None:
    """Nama berkas → label unit yang dipakai di web.

        yama-20      → 'Yama 20'
        kumo-1-2     → 'Kumo 1-2'      (tanda hubung nomor dipertahankan)
        yama-12a     → 'Yama 12'       (akhiran a/b = foto kedua unit sama)
        hana-7-baru  → 'Hana 7'
        adi-09       → 'Adiluhung 9'   (nol di depan dibuang)
        wa-a11       → None            (prefiksnya bukan tipe — jangan mengarang)
    """
    prefix, _, nomor = slug_label.partition("-")
    tipe = TYPE_LABEL.get(prefix)
    if not tipe:
        return None
    nomor = re.sub(r"-?baru$", "", nomor)          # 'hana-7-baru'
    nomor = re.sub(r"(?<=\d)[ab]$", "", nomor)     # 'yama-12a' → '12'
    nomor = re.sub(r"\b0+(\d)", r"\1", nomor)      # '09' → '9'
    return f"{tipe} {nomor}".strip()


def encode(im: Image.Image, width: int, target_kb: int, dest: pathlib.Path) -> int:
    """Simpan WebP di bawah target_kb dengan menurunkan kualitas bertahap."""
    w, h = im.size
    if w > width:
        im = im.resize((width, round(h * width / w)), Image.LANCZOS)
    for q in (82, 76, 70, 64, 58, 52):
        im.save(dest, "WEBP", quality=q, method=6)
        if dest.stat().st_size <= target_kb * 1024:
            break
    return dest.stat().st_size


def main() -> int:
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    OUT_DATA.mkdir(parents=True, exist_ok=True)

    names = json.load(open("keep.json"))
    items, total = [], 0

    for fn in names:
        slug = fn[:-4]                      # buang .jpg
        if slug in DROP:
            continue
        proj_key = slug.split("__")[0]
        label = slug.split("__")[1]
        proj = PROJECTS[proj_key]

        im = Image.open(RAW / fn)
        im = im.convert("RGB")

        big = encode(im.copy(), 1200, 90, OUT_IMG / f"{slug}.webp")
        sml = encode(im.copy(), 480, 40, OUT_IMG / f"{slug}-t.webp")
        total += big + sml

        items.append({
            "slug": slug,
            "project": proj["name"],
            "projectKey": proj_key,
            "unit": unit_label(label),
            "photo": f"/assets/img/serah-terima/{slug}.webp",
            "thumb": f"/assets/img/serah-terima/{slug}-t.webp",
            "featured": FEATURED.index(slug) if slug in FEATURED else None,
        })

    # Urutan tampil: proyek terbaru dulu, lalu nama unit
    items.sort(key=lambda x: (PROJECTS[x["projectKey"]]["order"], x["unit"] or "zz"))

    counts = collections.Counter(i["project"] for i in items)
    payload = {
        "note": "Arsip serah terima Kawa Village & Royal Mansion (pra-dashboard). "
                "Entri baru datang otomatis dari Progress Dashboard setelah "
                "disetujui approver — lihat /api/public/serah-terima.",
        "total": len(items),
        "perProject": dict(counts),
        "items": items,
    }
    (OUT_DATA / "serah-terima-arsip.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=1)
    )

    print(f"tayang: {len(items)} foto (dibuang {len(DROP)})")
    for k, v in counts.most_common():
        print(f"  {k}: {v}")
    print(f"total berat aset: {total/1024/1024:.2f} MB "
          f"({total/len(items)/1024:.0f} KB rata-rata per foto ×2 ukuran)")
    print(f"featured terpasang: {sum(1 for i in items if i['featured'] is not None)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
