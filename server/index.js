import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool, initDatabase } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middlewares - Increased limit for base64 photo uploads
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.json({
      status: 'ok',
      database: 'MySQL Connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      database: 'MySQL Disconnected',
      error: err.message,
    });
  }
});

// ---------------------------------------------------------
// AUTH: /api/login
// ---------------------------------------------------------
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }

    const [users] = await pool.query(
      'SELECT id, username, password, name, role FROM users WHERE username = ? LIMIT 1',
      [username.trim()]
    );

    if (users.length === 0 || users[0].password !== password) {
      return res.status(401).json({ error: 'Nama pengguna atau kata sandi salah.' });
    }

    const user = users[0];
    res.json({
      isAuthenticated: true,
      username: user.username,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server database.' });
  }
});

// ---------------------------------------------------------
// FOLDERS: /api/folders
// ---------------------------------------------------------
app.get('/api/folders', async (req, res) => {
  try {
    // 1. Get all folders
    const [folders] = await pool.query(
      'SELECT id, name, description, created_at AS createdAt, updated_at AS updatedAt FROM folders ORDER BY created_at DESC'
    );

    // 2. Get all cards
    const [cards] = await pool.query(
      `SELECT id, folder_id AS folderId, title, name, company, id_label AS idLabel, 
              id_number AS idNumber, photo_url AS photoUrl, code_format AS codeFormat, 
              qr_type AS qrType, qr_code_url AS qrCodeUrl, color_theme AS colorTheme, sort_order AS sortOrder 
       FROM cards ORDER BY sort_order ASC, created_at ASC`
    );

    // 3. Group cards into folders
    const folderMap = new Map();
    for (const f of folders) {
      folderMap.set(f.id, { ...f, cards: [] });
    }

    for (const c of cards) {
      if (folderMap.has(c.folderId)) {
        folderMap.get(c.folderId).cards.push(c);
      }
    }

    res.json(Array.from(folderMap.values()));
  } catch (err) {
    console.error('Get folders error:', err);
    res.status(500).json({ error: 'Gagal mengambil data folder dari database MySQL.' });
  }
});

// Create folder
app.post('/api/folders', async (req, res) => {
  try {
    const { id, name, description, cards = [] } = req.body;
    const folderId = id || `folder-${Date.now()}`;

    await pool.query(
      'INSERT INTO folders (id, name, description) VALUES (?, ?, ?)',
      [folderId, name || 'Folder Baru', description || '']
    );

    // If initial cards provided, insert them
    if (Array.isArray(cards) && cards.length > 0) {
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        await pool.query(
          `INSERT INTO cards (id, folder_id, title, name, company, id_label, id_number, photo_url, code_format, qr_type, qr_code_url, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            c.id || `card-${Date.now()}-${i}`,
            folderId,
            c.title || '',
            c.name || '',
            c.company || '',
            c.idLabel || '',
            c.idNumber || '',
            c.photoUrl || '',
            c.codeFormat || 'qr',
            c.qrType || 'auto',
            c.qrCodeUrl || '',
            i + 1,
          ]
        );
      }
    }

    res.json({ id: folderId, name, description, cards });
  } catch (err) {
    console.error('Create folder error:', err);
    res.status(500).json({ error: 'Gagal membuat folder di MySQL.' });
  }
});

// Update folder
app.put('/api/folders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    await pool.query(
      'UPDATE folders SET name = ?, description = ? WHERE id = ?',
      [name, description, id]
    );

    res.json({ success: true, id, name, description });
  } catch (err) {
    console.error('Update folder error:', err);
    res.status(500).json({ error: 'Gagal memperbarui folder.' });
  }
});

// Delete folder
app.delete('/api/folders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM folders WHERE id = ?', [id]);
    res.json({ success: true, id });
  } catch (err) {
    console.error('Delete folder error:', err);
    res.status(500).json({ error: 'Gagal menghapus folder.' });
  }
});

// Sync folder's cards in bulk (Save all cards for a folder)
app.put('/api/folders/:id/cards/sync', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id: folderId } = req.params;
    const { cards = [] } = req.body;

    // Delete existing cards in folder
    await connection.query('DELETE FROM cards WHERE folder_id = ?', [folderId]);

    // Insert new cards
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      await connection.query(
        `INSERT INTO cards (id, folder_id, title, name, company, id_label, id_number, photo_url, code_format, qr_type, qr_code_url, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id || `card-${Date.now()}-${i}`,
          folderId,
          c.title || '',
          c.name || '',
          c.company || '',
          c.idLabel || '',
          c.idNumber || '',
          c.photoUrl || '',
          c.codeFormat || 'qr',
          c.qrType || 'auto',
          c.qrCodeUrl || '',
          i + 1,
        ]
      );
    }

    // Touch folder updated_at
    await connection.query('UPDATE folders SET updated_at = NOW() WHERE id = ?', [folderId]);

    await connection.commit();
    res.json({ success: true, count: cards.length });
  } catch (err) {
    await connection.rollback();
    console.error('Sync cards error:', err);
    res.status(500).json({ error: 'Gagal menyimpan kartu ke database.' });
  } finally {
    connection.release();
  }
});

// ---------------------------------------------------------
// PRINT SETTINGS: /api/settings
// ---------------------------------------------------------
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM settings WHERE id = "global" LIMIT 1');
    if (rows.length === 0) {
      return res.json({});
    }
    const r = rows[0];
    res.json({
      pageOrientation: r.page_orientation,
      cardWidthMm: parseFloat(r.card_width_mm),
      cardHeightMm: parseFloat(r.card_height_mm),
      gapFrontBackMm: parseFloat(r.gap_front_back_mm),
      showCutMarks: Boolean(r.show_cut_marks),
      showFoldMarks: Boolean(r.show_fold_marks),
      marginMm: parseFloat(r.margin_mm),
      gapXMm: parseFloat(r.gap_x_mm),
      gapYMm: parseFloat(r.gap_y_mm),
      showPageNumbers: Boolean(r.show_page_numbers),
      cardBackImage: r.card_back_image || '/logos/card-back.png',
      dicLogoUrl: r.dic_logo_url || '/logos/dic-logo.jpg',
      k3LogoUrl: r.k3_logo_url || '/logos/k3-logo.jpg',
    });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Gagal mengambil pengaturan.' });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const s = req.body;
    await pool.query(
      `INSERT INTO settings (id, page_orientation, card_width_mm, card_height_mm, gap_front_back_mm, show_cut_marks, show_fold_marks, margin_mm, gap_x_mm, gap_y_mm, show_page_numbers, card_back_image, dic_logo_url, k3_logo_url)
       VALUES ('global', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         page_orientation = VALUES(page_orientation),
         card_width_mm = VALUES(card_width_mm),
         card_height_mm = VALUES(card_height_mm),
         gap_front_back_mm = VALUES(gap_front_back_mm),
         show_cut_marks = VALUES(show_cut_marks),
         show_fold_marks = VALUES(show_fold_marks),
         margin_mm = VALUES(margin_mm),
         gap_x_mm = VALUES(gap_x_mm),
         gap_y_mm = VALUES(gap_y_mm),
         show_page_numbers = VALUES(show_page_numbers),
         card_back_image = VALUES(card_back_image),
         dic_logo_url = VALUES(dic_logo_url),
         k3_logo_url = VALUES(k3_logo_url)`,
      [
        s.pageOrientation || 'landscape',
        s.cardWidthMm || 54.00,
        s.cardHeightMm || 86.00,
        s.gapFrontBackMm || 6.00,
        s.showCutMarks ? 1 : 0,
        s.showFoldMarks ? 1 : 0,
        s.marginMm || 10.00,
        s.gapXMm || 16.00,
        s.gapYMm || 10.00,
        s.showPageNumbers ? 1 : 0,
        s.cardBackImage || '/logos/card-back.png',
        s.dicLogoUrl || '/logos/dic-logo.jpg',
        s.k3LogoUrl || '/logos/k3-logo.jpg',
      ]
    );

    res.json({ success: true, settings: s });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Gagal menyimpan pengaturan ke MySQL.' });
  }
});

// Start server
async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`📡 Backend API Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

start();

