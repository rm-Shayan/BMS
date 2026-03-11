import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";

// Helper to determine the temp base directory
const getTempDir = () => {
  // On Vercel, we MUST use /tmp
  if (process.env.VERCEL) {
    return os.tmpdir();
  }
  
  // Local development: use Public/Temp, but fallback to os.tmpdir() if it fails
  const localTemp = path.join(process.cwd(), "Public", "Temp");
  try {
    if (!fs.existsSync(localTemp)) {
      fs.mkdirSync(localTemp, { recursive: true });
    }
    return localTemp;
  } catch (err) {
    console.warn("⚠️ Could not create Public/Temp, falling back to system temp:", err.message);
    return os.tmpdir();
  }
};

const tempDir = getTempDir();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});


const fileFilter = (req, file, cb) => {
  const allowedExt = /jpeg|jpg|png|webp|gif|svg|pdf|xls|xlsx/;

  const allowedMime = /jpeg|jpg|png|webp|gif|svg\+xml|svg|pdf|vnd.ms-excel|vnd.openxmlformats-officedocument.spreadsheetml.sheet/;

  const extname = allowedExt.test(
    path.extname(file.originalname).toLowerCase().slice(1)
  );

  const mime = allowedMime.test(file.mimetype.toLowerCase());

  if (extname && mime) cb(null, true);
  else
    cb(
      new Error(
        "Only image files (jpeg, jpg, png, webp, gif, svg), PDF, and Excel files (xls, xlsx) are allowed!"
      )
    );
};

export default fileFilter;



export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, 
    files: 4,            
  },
});