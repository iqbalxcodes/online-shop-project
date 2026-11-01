// Validasi input sederhana tanpa library tambahan.
//
// Contoh aturan:
//   { name: { type: "string", required: true, minLength: 2, label: "Nama" } }
//
// Tipe yang didukung: string, email, url, number, integer.
// Opsi lain: required, min, max, minLength, maxLength, enum, pattern, patternMessage, allowEmpty.
//
// Hanya field yang ada di aturan yang diteruskan ke handler (lewat req.validated),
// jadi field lain yang dikirim client (misalnya "role") otomatis diabaikan.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/\S+$/i;

export const PHONE_RE = /^(\+62|62|0)8\d{7,12}$/;

function checkField(raw, rule) {
    const label = rule.label;
    let value = typeof raw === "string" ? raw.trim() : raw;

    if (["string", "email", "url"].includes(rule.type)) {
        if (typeof value !== "string") return { error: `${label} harus berupa teks` };
        if (rule.minLength && value.length < rule.minLength) {
            return { error: `${label} minimal ${rule.minLength} karakter` };
        }
        if (rule.maxLength && value.length > rule.maxLength) {
            return { error: `${label} maksimal ${rule.maxLength} karakter` };
        }
        if (rule.type === "email") {
            value = value.toLowerCase();
            if (!EMAIL_RE.test(value)) return { error: `${label} tidak valid` };
        }
        if (rule.type === "url" && !URL_RE.test(value)) {
            return { error: `${label} harus berupa URL yang diawali http:// atau https://` };
        }
    }

    if (rule.type === "number" || rule.type === "integer") {
        const num = typeof value === "string" ? Number(value) : value;
        if (typeof num !== "number" || !Number.isFinite(num)) {
            return { error: `${label} harus berupa angka` };
        }
        if (rule.type === "integer" && !Number.isInteger(num)) {
            return { error: `${label} harus berupa bilangan bulat` };
        }
        if (rule.min !== undefined && num < rule.min) return { error: `${label} minimal ${rule.min}` };
        if (rule.max !== undefined && num > rule.max) return { error: `${label} maksimal ${rule.max}` };
        value = num;
    }

    if (rule.enum && !rule.enum.includes(value)) {
        return { error: `${label} harus salah satu dari: ${rule.enum.join(", ")}` };
    }
    if (rule.pattern && !rule.pattern.test(String(value))) {
        return { error: rule.patternMessage || `${label} tidak valid` };
    }

    return { value };
}

/**
 * Middleware validasi body request.
 * @param {object} rules aturan per field
 * @param {{ partial?: boolean }} options partial = true untuk update (PUT/PATCH):
 *        field wajib boleh tidak dikirim, tapi minimal satu field harus ada.
 */
export function validate(rules, { partial = false } = {}) {
    return (req, res, next) => {
        const body = req.body && typeof req.body === "object" ? req.body : {};
        const errors = {};
        const clean = {};

        for (const [field, rule] of Object.entries(rules)) {
            const raw = body[field];
            const empty = raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "");

            if (empty) {
                if (rule.required && !partial) errors[field] = `${rule.label} wajib diisi`;
                // allowEmpty: string kosong dipakai untuk mengosongkan field opsional (misal nomor HP)
                else if (rule.allowEmpty && typeof raw === "string") clean[field] = "";
                continue;
            }

            const { value, error } = checkField(raw, rule);
            if (error) errors[field] = error;
            else clean[field] = value;
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                error: Object.values(errors).join(". "),
                details: errors
            });
        }

        if (partial && Object.keys(clean).length === 0) {
            return res.status(400).json({ error: "Tidak ada data yang dikirim untuk diubah" });
        }

        req.validated = clean;
        next();
    };
}
