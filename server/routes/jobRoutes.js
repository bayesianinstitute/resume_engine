import express from 'express';
import { addJob, searchJobs, listJobs,scrapJob } from '../controllers/jobController.js';

const router = express.Router();

router.post('/add', addJob);            // Add a job
router.get('/search', searchJobs);          // Search jobs
router.get('/list', listJobs);       // List jobs (with pagination)
router.post('/scrap/:title/:location/:hours', scrapJob);       // scrapJob jobs

export default router;
