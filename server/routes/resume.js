import express from 'express';
import multer from 'multer';
import { matcher,stats,getResumeAnalysis,getSkillProgresses,getStatusCount,getAllResumes,resumeview,bulkMatcher, deleteResume } from '../controllers/resume.js';
import { getLinkedInJobs } from '../controllers/linkedinController.js';
import { generatePreparationResources } from '../controllers/interviewController.js';
import { getJobs, createJob, updateJobStatus,deleteJob } from '../controllers/jobTrackerController.js';
import { verifyTokenMiddleware } from '../middleware/auth.js'; 

const router = express.Router();
const upload = multer();

router.post('/matcher', matcher);
router.post('/bulkMatcher', bulkMatcher);
router.post('/stats', upload.single('resume'), stats);
router.get('/getAllResumes', getAllResumes);
router.get('/view/:userId/:fileName', resumeview);
router.delete('/', deleteResume);
router.post('/resumeanalysis', getResumeAnalysis);
router.post('/resumeskills', getSkillProgresses);
router.post('/resumestatus', getStatusCount);
router.post('/scrape', getLinkedInJobs);
router.post('/preparation', generatePreparationResources);
router.get('/jobtracker',verifyTokenMiddleware,getJobs);
router.post('/jobtracker',verifyTokenMiddleware, createJob);
router.patch('/jobtracker/:id',verifyTokenMiddleware, updateJobStatus);

router.delete('/jobtracker/:id',verifyTokenMiddleware, deleteJob);
export default router;
