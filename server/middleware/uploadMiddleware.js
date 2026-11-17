const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'skillbridge-uploads')
  : path.join(__dirname, '..', 'uploads');
const projectUploadDir = path.join(uploadDir, 'projects');
const taskUploadDir = path.join(uploadDir, 'tasks');
const chatUploadDir = path.join(uploadDir, 'chat');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(projectUploadDir)) {
  fs.mkdirSync(projectUploadDir, { recursive: true });
}
for (const dir of [taskUploadDir, chatUploadDir]) if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Avatar Storage
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${req.user ? (req.user._id || req.user.id) : 'guest'}-${uniqueSuffix}${ext}`);
  },
});

// Project Media Storage
const projectStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, projectUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `proj-${safeName}-${uniqueSuffix}${ext}`);
  },
});

const avatarFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed for avatar!'));
  }
};

const projectFilter = (req, file, cb) => {
  const allowedExts = /jpeg|jpg|png|webp|gif|pdf|ppt|pptx|mp4|webm/;
  const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpg, png, webp), PDFs, and presentation files are supported.'));
  }
};

const safeAttachmentTypes = new Map([
  ['.jpg', ['image/jpeg']], ['.jpeg', ['image/jpeg']], ['.png', ['image/png']], ['.webp', ['image/webp']], ['.gif', ['image/gif']],
  ['.pdf', ['application/pdf']], ['.doc', ['application/msword', 'application/octet-stream']], ['.docx', ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream']],
  ['.zip', ['application/zip', 'application/x-zip-compressed', 'application/octet-stream']], ['.txt', ['text/plain']], ['.csv', ['text/csv', 'application/vnd.ms-excel', 'application/octet-stream']],
]);
const attachmentFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const types = safeAttachmentTypes.get(ext);
  if (types && types.includes(file.mimetype)) return cb(null, true);
  cb(new Error('This file type is not allowed. Upload an image, PDF, DOC/DOCX, ZIP, TXT, or CSV file.'));
};
const createAttachmentUpload = (directory, prefix) => multer({
  storage: multer.diskStorage({ destination: directory, filename: (req, file, cb) => cb(null, `${prefix}-${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname).toLowerCase()}`) }),
  limits: { fileSize: 15 * 1024 * 1024 }, fileFilter: attachmentFilter,
});

const upload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: avatarFilter,
});

const uploadProjectMedia = multer({
  storage: projectStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: projectFilter,
});

module.exports = upload;
module.exports.uploadDirectory = uploadDir;
module.exports.uploadProjectMedia = uploadProjectMedia;
module.exports.uploadTaskAttachment = createAttachmentUpload(taskUploadDir, 'task');
module.exports.uploadChatAttachment = createAttachmentUpload(chatUploadDir, 'chat');
