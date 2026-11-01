// Endpoint yang tidak terdaftar
export function notFound(req, res) {
    res.status(404).json({ error: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan` });
}

// Satu tempat untuk mengubah error menjadi respons JSON yang konsisten.
// Express 5 otomatis meneruskan error dari handler async ke sini.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
    // Body bukan JSON yang valid
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ error: "Format JSON tidak valid" });
    }

    // Validasi schema Mongoose (required, min, enum, dst.)
    if (err.name === "ValidationError") {
        const details = Object.fromEntries(
            Object.entries(err.errors).map(([field, e]) => [field, e.message])
        );
        return res.status(400).json({ error: Object.values(details).join(". "), details });
    }

    // ID MongoDB tidak valid, misalnya GET /api/products/abc
    if (err.name === "CastError") {
        return res.status(400).json({ error: `Format ${err.path} tidak valid` });
    }

    // Data unik bentrok (misalnya email sudah terdaftar)
    if (err.code === 11000) {
        return res.status(409).json({ error: "Data sudah terdaftar", fields: err.keyValue });
    }

    // Error yang sengaja dilempar dengan status (lihat httpError di bawah)
    if (err.status && err.status < 500) {
        return res.status(err.status).json({ error: err.message });
    }

    console.error(err);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
}

export function httpError(status, message) {
    const err = new Error(message);
    err.status = status;
    return err;
}
