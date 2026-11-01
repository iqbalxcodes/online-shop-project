export const rupiah = (n) => `Rp ${Number(n || 0).toLocaleString("id-ID")}`;

export const formatDate = (d) =>
    new Date(d).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

// Nomor pesanan pendek untuk ditampilkan, contoh "#A1B2C3D4"
export const shortId = (id) => String(id).slice(-8).toUpperCase();
