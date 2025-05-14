import express from "express";
import multer from "multer";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const router = express.Router();

// Ensure upload folder exists
const uploadFolder = path.resolve("Uploads");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// Route
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const inputPath = req.file.path;
    const outputPath = inputPath.replace(path.extname(inputPath), ".webp");

    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);

    fs.unlinkSync(inputPath); // optional: delete original file

    res.json({
      message: "Upload and conversion successful",
      fileUrl: `/Uploads/${path.basename(outputPath)}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Image upload or conversion failed" });
  }
});

export default router;
