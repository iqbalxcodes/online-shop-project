import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    try {
        req.userId = jwt.verify(token, process.env.JWT_SECRET).sub;
        next();
    } catch {
        res.status(401).json({ error: "Unauthorized" });
    }
}