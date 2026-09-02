import { Router } from 'express';
import multer from 'multer';
import { ResumeController } from '../../controllers/resume.controller';
import { authenticate } from '../../middleware/auth';
import { uploadRateLimiter } from '../../middleware/security';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

router.use(authenticate);

// Upload and process a resume
router.post('/upload', uploadRateLimiter, upload.single('resume'), ResumeController.upload);

// Get processing status
router.get('/:id/status', ResumeController.getStatus);

// Retry failed processing
router.post('/:id/retry', ResumeController.retry);

// List resumes
router.get('/', ResumeController.list);

export default router;
