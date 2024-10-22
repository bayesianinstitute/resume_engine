import express from 'express';
import { getJobs, createJob, updateJobStatus,deleteJob  } from '../controllers/jobTrackerController.js';

const router = express.Router();

// Route to get all jobs
router.get('/jobtracker', getJobs);

// Route to create a new job
router.post('/jobtracker', createJob);

// Route to update job status
router.patch('/jobtracker/:id', updateJobStatus);

router.delete('/jobtracker/:id', deleteJob);

export default router;
