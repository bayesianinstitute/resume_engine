import express from 'express';
import { addJob, searchJobs, listJobs,scrapJob,uploadJobsFromCSV } from '../controllers/jobController.js';
import { getAllJobIds} from '../controllers/resume.js';
import { verifyApiKey } from "../middleware/verifyApiKey.js"; 
import multer from 'multer';
const router = express.Router();

// Multer storage configuration
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only allow CSV files
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' || 
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  }
});

router.post('/add', addJob);            // Add a job
router.post('/search', searchJobs);          // Search jobs
router.get('/list', listJobs);       // List jobs (with pagination)
router.post('/scrap', scrapJob);       // scrapJob jobs
router.post('/upload-csv',verifyApiKey, 
    upload.single('jobsFile'), 
    uploadJobsFromCSV
  );

router.get('/jobs/ids',verifyApiKey, getAllJobIds);
export default router;
