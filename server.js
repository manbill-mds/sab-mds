const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Inisialisasi Database SQLite
const db = new sqlite3.Database('./database_absensi.db', (err) => {
    if (err) console.error("Gagal membuka database:", err.message);
    else console.log("Terhubung ke database SQLite.");
});

// Membuat Tabel Master Petugas dan Tabel Absensi
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS petugas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nip TEXT UNIQUE,
        nama TEXT,
        koordinator TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS absensi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tanggal TEXT,
        pemeriksa TEXT,
        nip TEXT,
        hadir INTEGER,
        seragam INTEGER,
        idcard INTEGER,
        sepatu INTEGER,
        keterangan TEXT,
        UNIQUE(tanggal, nip) ON CONFLICT REPLACE
    )`);
});

// === API ROUTES ===

// 1. Ambil Semua Data Petugas
app.get('/api/petugas', (req, res) => {
    db.all("SELECT * FROM petugas ORDER BY id ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. Tambah / Edit Petugas
app.post('/api/petugas', (req, res) => {
    const { nip, nama, koordinator } = req.body;
    db.run(`INSERT INTO petugas (nip, nama, koordinator) VALUES (?, ?, ?)
            ON CONFLICT(nip) DO UPDATE SET nama=excluded.nama, koordinator=excluded.koordinator`,
        [nip, nama, koordinator],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Data petugas berhasil disimpan" });
        }
    );
});

// 3. Hapus Petugas
app.delete('/api/petugas/:nip', (req, res) => {
    db.run("DELETE FROM petugas WHERE nip = ?", [req.params.nip], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Petugas berhasil dihapus" });
    });
});

// 4. Ambil Absensi Berdasarkan Tanggal/Bulan
app.get('/api/absensi', (req, res) => {
    const { tanggal, bulan } = req.query;
    let query = "SELECT * FROM absensi";
    let params = [];

    if (tanggal) {
        query += " WHERE tanggal = ?";
        params.push(tanggal);
    } else if (bulan) {
        query += " WHERE tanggal LIKE ?";
        params.push(${bulan}-%);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 5. Simpan / Update Absensi Harian
app.post('/api/absensi', (req, res) => {
    const { tanggal, pemeriksa, records } = req.body;
    
    const stmt = db.prepare(`INSERT OR REPLACE INTO absensi (tanggal, pemeriksa, nip, hadir, seragam, idcard, sepatu, keterangan)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

    db.serialize(() => {
        for (const nip in records) {
            const r = records[nip];
            stmt.run([tanggal, pemeriksa, nip, r.hadir ? 1 : 0, r.seragam ? 1 : 0, r.idcard ? 1 : 0, r.sepatu ? 1 : 0, r.keterangan || '']);
        }
    });

    stmt.finalize((err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Absensi berhasil disimpan ke database" });
    });
});

// Jalankan Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(Server database berjalan di http://localhost:${PORT});
});