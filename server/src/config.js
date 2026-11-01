export const config = {
    mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/spd_lab",
    corsOrigin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
        : null
};
