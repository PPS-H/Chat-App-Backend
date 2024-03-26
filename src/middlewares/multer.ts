import multer from "multer";

export const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const attachmentsUpload = multer({
  limits: {
    fileSize: 30 * 1024 * 1024,
  },
});
