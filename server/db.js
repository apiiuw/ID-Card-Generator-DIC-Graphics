import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dic_idcard_generator',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

export const pool = mysql.createPool(DB_CONFIG);

export async function initDatabase() {
  try {
    // 1. Ensure database exists
    const rootConn = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
    });
    await rootConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await rootConn.end();

    // 2. Initialize tables
    const conn = await pool.getConnection();

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS folders (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id VARCHAR(64) PRIMARY KEY,
        folder_id VARCHAR(64) NOT NULL,
        title VARCHAR(100) DEFAULT '',
        name VARCHAR(255) DEFAULT '',
        company VARCHAR(255) DEFAULT '',
        id_label VARCHAR(100) DEFAULT '',
        id_number VARCHAR(100) DEFAULT '',
        photo_url LONGTEXT,
        code_format VARCHAR(20) DEFAULT 'qr',
        qr_type VARCHAR(20) DEFAULT 'auto',
        qr_code_url LONGTEXT,
        color_theme VARCHAR(50) DEFAULT '#000000',
        sort_order INT DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(64) PRIMARY KEY DEFAULT 'global',
        folder_id VARCHAR(64) NULL,
        page_orientation VARCHAR(20) DEFAULT 'landscape',
        card_width_mm DECIMAL(6,2) DEFAULT 54.00,
        card_height_mm DECIMAL(6,2) DEFAULT 86.00,
        gap_front_back_mm DECIMAL(6,2) DEFAULT 6.00,
        show_cut_marks BOOLEAN DEFAULT TRUE,
        show_fold_marks BOOLEAN DEFAULT TRUE,
        margin_mm DECIMAL(6,2) DEFAULT 10.00,
        gap_x_mm DECIMAL(6,2) DEFAULT 16.00,
        gap_y_mm DECIMAL(6,2) DEFAULT 10.00,
        show_page_numbers BOOLEAN DEFAULT TRUE,
        card_back_image LONGTEXT,
        dic_logo_url LONGTEXT,
        k3_logo_url LONGTEXT,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Seed User 'admin' / 'PTD1C123?&'
    const [existingUsers] = await conn.query('SELECT id FROM users WHERE username = ?', ['admin']);
    if (existingUsers.length === 0) {
      await conn.query(
        'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
        ['admin', 'PTD1C123?&', 'Administrator DIC Karawang', 'Administrator K3 & HRD']
      );
      console.log('✅ MySQL: Admin user initialized (admin / PTD1C123?&)');
    } else {
      await conn.query('UPDATE users SET password = ? WHERE username = ?', ['PTD1C123?&', 'admin']);
    }

    // 4. Seed Default Folders & Cards if folders empty
    const [existingFolders] = await conn.query('SELECT id FROM folders LIMIT 1');
    if (existingFolders.length === 0) {
      console.log('🌱 MySQL: Seeding initial folders and cards...');

      const defaultFolderId = 'folder-kontraktor-utama';
      await conn.query(
        'INSERT INTO folders (id, name, description) VALUES (?, ?, ?)',
        [
          defaultFolderId,
          'Batch Kontraktor Kaizen & Riken',
          'Data kartu kontraktor PT Kaizen Global Indonesia & PT Riken Engineering',
        ]
      );

      const initialCards = [
        {
          id: 'card-1',
          folder_id: defaultFolderId,
          title: 'KONTRAKTOR',
          name: 'NABILLAH NURJIHAN',
          company: 'PT. KAIZEN GLOBAL INDONESIA',
          id_label: 'ID KONTRAKTOR',
          id_number: 'VDRKRW-26100414',
          photo_url: '/logos/image4.jpeg',
          code_format: 'qr',
          qr_type: 'auto',
          qr_code_url: '',
          sort_order: 1,
        },
        {
          id: 'card-2',
          folder_id: defaultFolderId,
          title: 'KONTRAKTOR',
          name: 'OMI SUMARNI',
          company: 'CV TIGA BINTANG',
          id_label: 'ID KONTRAKTOR',
          id_number: 'VDRKRW-26100415',
          photo_url: '/logos/image6.jpeg',
          code_format: 'qr',
          qr_type: 'auto',
          qr_code_url: '',
          sort_order: 2,
        },
        {
          id: 'card-3',
          folder_id: defaultFolderId,
          title: 'KONTRAKTOR',
          name: 'ANDRI JUANDI',
          company: 'PT. RIKEN ENGINEERING PERKASA',
          id_label: 'ID KONTRAKTOR',
          id_number: 'VDRKRW-26100416',
          photo_url: '/logos/image10.jpeg',
          code_format: 'qr',
          qr_type: 'auto',
          qr_code_url: '',
          sort_order: 3,
        },
        {
          id: 'card-4',
          folder_id: defaultFolderId,
          title: 'KOPKAR',
          name: 'IMAM ASEP SAEPUDIN',
          company: 'KOPKAR',
          id_label: 'ID KOPKAR',
          id_number: 'KKS26006',
          photo_url: '/logos/image11.jpeg',
          code_format: 'qr',
          qr_type: 'auto',
          qr_code_url: '',
          sort_order: 4,
        },
      ];

      for (const card of initialCards) {
        await conn.query(
          `INSERT INTO cards (id, folder_id, title, name, company, id_label, id_number, photo_url, code_format, qr_type, qr_code_url, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            card.id,
            card.folder_id,
            card.title,
            card.name,
            card.company,
            card.id_label,
            card.id_number,
            card.photo_url,
            card.code_format,
            card.qr_type,
            card.qr_code_url,
            card.sort_order,
          ]
        );
      }

      // Seed 2 additional sample folders
      await conn.query(
        'INSERT INTO folders (id, name, description) VALUES (?, ?, ?)',
        ['folder-kopkar-staff', 'Karyawan & Staff Koperasi (Kopkar)', 'ID Card anggota dan pengurus koperasi PT DIC Graphics']
      );

      await conn.query(
        'INSERT INTO folders (id, name, description) VALUES (?, ?, ?)',
        ['folder-visitor-tamu', 'Tamu Perusahaan & Visitor K3', 'Kartu tanda pengenal visitor khusus area pabrik DIC Karawang']
      );

      console.log('✅ MySQL: Initial folders & cards seeded successfully.');
    }

    // Ensure 'folder-krw-terbaru' exists and has all 74 cards
    const [krwFolder] = await conn.query('SELECT id FROM folders WHERE id = "folder-krw-terbaru"');
    if (krwFolder.length === 0) {
      await conn.query(
        'INSERT INTO folders (id, name, description) VALUES (?, ?, ?)',
        [
          'folder-krw-terbaru',
          'ID Card Kontraktor KRW Terbaru',
          'Seluruh data 74 ID Card lengkap dari file template ID CARD KONTRAKTOR KRW 26090378-26100414 - Rev 1.xlsx',
        ]
      );
    }

    const [krwCardCount] = await conn.query('SELECT COUNT(*) AS total FROM cards WHERE folder_id = "folder-krw-terbaru"');
    const totalKrwCards = krwCardCount[0]?.total || 0;
    if (totalKrwCards < 74 && fs.existsSync('src/data/allExtractedCards.json')) {
      console.log(`🌱 MySQL: Seeding 74 contractor cards to folder-krw-terbaru (currently ${totalKrwCards})...`);
      const cards = JSON.parse(fs.readFileSync('src/data/allExtractedCards.json', 'utf8'));
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        await conn.query(
          `INSERT INTO cards (id, folder_id, title, name, company, id_label, id_number, photo_url, code_format, qr_type, qr_code_url, color_theme, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             title = VALUES(title), name = VALUES(name), company = VALUES(company),
             id_label = VALUES(id_label), id_number = VALUES(id_number), photo_url = VALUES(photo_url),
             code_format = VALUES(code_format), qr_type = VALUES(qr_type), qr_code_url = VALUES(qr_code_url),
             color_theme = VALUES(color_theme), sort_order = VALUES(sort_order)`,
          [
            c.id,
            'folder-krw-terbaru',
            c.title || 'KONTRAKTOR',
            c.name || '',
            c.company || '',
            c.idLabel || 'ID KONTRAKTOR',
            c.idNumber || '',
            c.photoUrl || '',
            c.codeFormat || 'qr',
            c.qrType || 'auto',
            c.qrCodeUrl || '',
            c.colorTheme || '#000000',
            c.sortOrder || (i + 1),
          ]
        );
      }
      console.log(`✅ MySQL: Folder 'ID Card Kontraktor KRW Terbaru' synced with ${cards.length} cards.`);
    }

    // 5. Seed default settings (Landscape 2x2 = 4 pairs per A4, proportional to 80mm x 110mm / 8x11 cm)
    const [existingSettings] = await conn.query(
      'SELECT id, page_orientation, card_width_mm, card_height_mm, gap_x_mm FROM settings WHERE id = "global"'
    );
    if (existingSettings.length === 0) {
      await conn.query(`
        INSERT INTO settings (id, page_orientation, card_width_mm, card_height_mm, gap_front_back_mm, show_cut_marks, show_fold_marks, margin_mm, gap_x_mm, gap_y_mm, show_page_numbers, card_back_image, dic_logo_url, k3_logo_url)
        VALUES ('global', 'landscape', 80.00, 110.00, 2.00, 0, 0, 8.00, 4.00, 4.00, 1, '/logos/card-back.png', '/logos/dic-logo.jpg', '/logos/k3-logo.jpg')
      `);
      console.log('✅ MySQL: Global print settings initialized (Landscape 4 pairs / 80x110 mm ratio).');
    } else if (
      (parseFloat(existingSettings[0].card_width_mm) === 54 &&
        parseFloat(existingSettings[0].card_height_mm) === 86) ||
      (existingSettings[0].page_orientation === 'portrait' &&
        parseFloat(existingSettings[0].card_width_mm) === 80 &&
        parseFloat(existingSettings[0].card_height_mm) === 110 &&
        parseFloat(existingSettings[0].gap_x_mm) === 10)
    ) {
      await conn.query(`
        UPDATE settings
        SET page_orientation = 'landscape',
            card_width_mm = 80.00,
            card_height_mm = 110.00,
            gap_front_back_mm = 2.00,
            show_cut_marks = 0,
            show_fold_marks = 0,
            margin_mm = 8.00,
            gap_x_mm = 4.00,
            gap_y_mm = 4.00
        WHERE id = 'global'
      `);
      console.log('✅ MySQL: Migrated print settings to Landscape 4 pairs per A4 sheet.');
    }

    conn.release();
    console.log(`🚀 MySQL Connected successfully to database: ${DB_CONFIG.database} on ${DB_CONFIG.host}:${DB_CONFIG.port}`);
  } catch (error) {
    console.error('❌ MySQL Initialization Error:', error);
    throw error;
  }
}

