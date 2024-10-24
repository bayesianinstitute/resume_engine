import express from 'express';
import multer from 'multer';
import { matcher,stats,getResumeAnalysis,getSkillProgresses,getStatusCount } from '../controllers/resume.js';
import { getLinkedInJobs } from '../controllers/linkedinController.js';
import { generatePreparationResources } from '../controllers/interviewController.js';
import { getJobs, createJob, updateJobStatus,deleteJob } from '../controllers/jobTrackerController.js';
import { verifyTokenMiddleware } from '../middleware/auth.js'; 

const router = express.Router();
const upload = multer();

router.post('/matcher', upload.single('resume'), matcher);
router.post('/stats', upload.single('resume'), stats);
router.post('/resumeanalysis', getResumeAnalysis);
router.post('/resumeskills', getSkillProgresses);
router.get('/resumestatus', getStatusCount);
router.post('/scrape', getLinkedInJobs);
router.post('/preparation', generatePreparationResources);
router.get('/jobtracker',verifyTokenMiddleware,getJobs);
router.post('/jobtracker',verifyTokenMiddleware, createJob);
router.patch('/jobtracker/:id',verifyTokenMiddleware, updateJobStatus);

router.delete('/jobtracker/:id',verifyTokenMiddleware, deleteJob);
export default router;
