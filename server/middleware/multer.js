import multer from "multer";
import { v4 as uuid } from "uuid";
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        const extName = file.originalname.split('.').pop();
        const uniqueFileName = `${uuid()}.${extName}`; // Append UUID to the original filename
        cb(null, uniqueFileName);
    }
});
export const singleUpload = multer({ storage: storage }).single("photo");
