import express from 'express';
import { addJob, searchJobs, listJobs } from '../controllers/jobController.js';

const router = express.Router();

router.post('/add', addJob);            // Add a job
router.get('/search', searchJobs);          // Search jobs
router.get('/list', listJobs);       // List jobs (with pagination)

export default router;
