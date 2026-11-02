import { Router } from 'express';
import multer from 'multer';
import { listSubmissions, getSubmissionDetail, markWinner, exportCsv } from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/auth.js';
import { importParticipants } from '../services/importerService.js';

const router = Router();
const upload = multer({ dest: 'uploads/temp/' });

// Protected Admin Routes
router.use(requireAdmin);

router.get('/submissions', listSubmissions);
router.get('/submissions/:cardId', getSubmissionDetail);
router.post('/verify-winner', markWinner);
router.get('/export-csv', exportCsv);

// Live Excel Import via Admin UI
router.post('/import-excel', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No Excel or CSV file provided.' });
      return;
    }
    const summary = await importParticipants(req.file.path);
    res.json({ success: true, summary });
  } catch (err) {
    next(err);
  }
});

export default router;
