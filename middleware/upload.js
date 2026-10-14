const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.baseUrl.split("/").pop();
    const folderName = `${type.charAt(0).toUpperCase() + type.slice(1)}Images`;
    const uploadDir = path.join(__dirname, `../uploads/OnlineImages/${folderName}`);
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

module.exports = upload;