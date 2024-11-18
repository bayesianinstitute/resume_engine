import express from 'express';
import { addJob, searchJobs, listJobs,scrapJob } from '../controllers/jobController.js';
import { getAllJobIds} from '../controllers/resume.js';
const router = express.Router();

router.post('/add', addJob);            // Add a job
router.post('/search', searchJobs);          // Search jobs
router.get('/list', listJobs);       // List jobs (with pagination)
router.post('/scrap', scrapJob);       // scrapJob jobs

router.get('/jobs/ids', getAllJobIds);
export default router;
