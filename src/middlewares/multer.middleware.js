import multer from "multer";
import path from "path";
import fs from "fs";

const tempDir = path.join(process.cwd(), "Public", "Temp");

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

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