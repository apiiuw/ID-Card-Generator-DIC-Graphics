# ID Card Generator - PT DIC Graphics Karawang

Aplikasi web modern untuk pembuatan dan pencetakan ID Card Kontraktor, Outsource, Magang, Kopkar, dan Tamu PT DIC Graphics Karawang.

## Fitur Utama

1. **Layout 1 Lembar A4 Mencakup Depan & Belakang Sekaligus**
   - Format cetak A4 Landscape (297 x 210 mm) mencakup **4 ID Card lengkap (Sisi Depan + Sisi Belakang)** dalam 1 lembar kertas yang sama (bukan 2 halaman terpisah).
   - Setiap kartu tersusun berdampingan (*Side-by-Side*):
     - **Sisi Depan** di kiri.
     - **Garis Lipat** (*Fold Line*) di tengah.
     - **Sisi Belakang (K3 Safety Rules)** di kanan.
   - Dilengkapi garis panduan potong luar (*Crop Marks*). Pengguna cukup memotong 4 kartu dan melipatnya di garis tengah untuk dimasukkan ke *holder* atau dilaminating.

2. **Desain Rapi & Proporsional (Tidak Gepeng)**
   - Menggunakan ukuran standar kartu ID (CR-80: 54 x 86 mm).
   - Fitur **Upload & Crop Foto** interaktif:
     - Zoom in / Zoom out
     - Putar 90° (*rotate*) & cermin horizontal (*flip*)
     - Rasio otomatis terkunci ke **3:4 (Pas Foto)** sehingga wajah tidak melar/gepeng.

3. **Kustomisasi Lengkap**
   - **Judul ID Card**: Dapat diubah bebas (misal: *ID CARD KONTRAKTOR*, *ID CARD OUTSOURCE*, *ID CARD MAGANG*, *KOPKAR*, dll). Tersedia tombol *Samakan Semua*.
   - **Nama Kontraktor**: Teks kapital otomatis, rapi dan terbaca jelas.
   - **Perusahaan / Vendor**: Dapat diubah sesuai vendor masing-masing.
   - **Label ID & Nomor ID**: Label (misal: *ID KONTRAKTOR*, *NOMOR ID*, *ID KOPKAR*) dan nomor ID dapat diubah kapan saja.

4. **QR Code Otomatis atau Upload (Bisa juga Barcode)**
   - **Auto dari ID**: QR Code digenerate otomatis secara real-time dari nomor ID dalam format vektor SVG tajam (sangat jelas saat dicetak dan mudah discan).
   - **Upload QR Code**: Pilihan untuk mengunggah gambar QR code manual jika memiliki QR code khusus.
   - Pilihan alternatif: Tersedia juga opsi beralih ke format Barcode garis jika sewaktu-waktu dibutuhkan.

5. **Penyimpanan Otomatis (Data Persistence)**
   - Semua perubahan otomatis tersimpan di browser (*localStorage*).
   - Fitur **Download Backup JSON** dan **Restore Data**.
   - Fitur **Import Cepat dari Excel** (copy-paste tabel Nama, Perusahaan, dan ID).

6. **Bagian Belakang Standar K3 PT DIC Graphics**
   - Menggunakan peraturan keselamatan K3 PT DIC Graphics Karawang (APD Wajib, Larangan K3, dan Call Center Darurat: 0812151616665).

## Cara Menjalankan Aplikasi

Aplikasi saat ini telah berjalan di:
- **Lokal**: [http://localhost:5173/](http://localhost:5173/)

Untuk menjalankan ulang sewaktu-waktu:
```bash
npm run dev
```

Untuk build produksi:
```bash
npm run build
```

## Menjalankan dengan Docker Compose

Arsitektur container:

| Service | Container | Image | Port (expose) | Keterangan |
|---|---|---|---|---|
| `id-card-dic-graphics-app` | `id-card-dic-graphics-app` | `id-card-dic-graphics-app` | 80 | Frontend (nginx, hasil `npm run build`) + reverse proxy `/api/` ke backend |
| `id-card-dic-graphics-backend` | `id-card-dic-graphics-backend` | `id-card-dic-graphics-backend` | 3001 | Backend Express API (`server/index.js`) |
| `id-card-dic-graphics-db` | `id-card-dic-graphics-db` | `mysql:8.0` | 3306 | MySQL 8, volume `id-card-dic-graphics_db_data` |

Frontend memanggil API lewat path relatif `/api/` (lihat `src/utils/api.ts`), sehingga di dalam container nginx meneruskannya ke `http://id-card-dic-graphics-backend:3001/api/` melalui network internal `autodev-net`.

Tech stack:

- Frontend: React 18 + Vite + Tailwind CSS (build statis diserve nginx)
- Backend: Node.js 20 + Express 5
- Database: MySQL 8 (seeding otomatis di `server/db.js` saat startup: user admin, folder & kartu contoh, settings global)

Setup & run:

```bash
# Buat network eksternal sekali saja
docker network create autodev-net

# Build & jalankan
docker compose -p id-card-dic-graphics build
docker compose -p id-card-dic-graphics up -d

# Cek log
docker compose -p id-card-dic-graphics logs

# Hentikan
docker compose -p id-card-dic-graphics down
```

Environment backend (sudah default di `docker-compose.yml`, bisa dioverride):

| Var | Default |
|---|---|
| `SERVER_PORT` | `3001` |
| `DB_HOST` | `id-card-dic-graphics-db` |
| `DB_PORT` | `3306` |
| `DB_USER` | `root` |
| `DB_PASSWORD` | `dic_graphics_secret` |
| `DB_NAME` | `dic_idcard_generator` |

Volume:

- `/project/autodev-py/data_sharing/id-card-dic-graphics:/app/uploads` pada service app & backend (file sharing/uploads)
- Named volume `id-card-dic-graphics_db_data:/var/lib/mysql` untuk persistensi MySQL

API documentation (base path `/api/`):

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/health` | Health check (cek koneksi MySQL) |
| POST | `/api/login` | Login `{username, password}` |
| GET | `/api/folders` | List folder + kartu |
| POST | `/api/folders` | Buat folder (+ kartu awal opsional) |
| PUT | `/api/folders/:id` | Update folder |
| DELETE | `/api/folders/:id` | Hapus folder |
| PUT | `/api/folders/:id/cards/sync` | Bulk sync kartu dalam folder |
| GET | `/api/settings` | Ambil print settings global |
| PUT | `/api/settings` | Simpan print settings global |

Kredensial default (seed otomatis): username `admin` / password `PTD1C123?&`.

## Helm Chart

Chart tersedia di `helmchart/`:

```bash
helm install id-card ./helmchart
helm upgrade id-card ./helmchart --set global.ingress.host=id-card.example.com
```

`values.yaml` memuat `global.ingress.enabled`, `global.ingress.host`, `global.ingress.tlsSecret`, serta `services.<name>.image` + `services.<name>.port` sesuai nama service docker-compose.

