import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_PATH = path.join(__dirname, '../uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_PATH),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
export const upload = multer({ storage });
export { UPLOADS_PATH };
