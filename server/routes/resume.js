import express from 'express';
import multer from 'multer';
import { matcher,getResumeMatchResults, stats,getResumeAnalysis,getSkillProgresses,getStatusCount,getAllResumes,resumeview, deleteResume, matcherEnterprise, handleAutomationData } from '../controllers/resume.js';
import { getLinkedInJobs } from '../controllers/linkedinController.js';
import { generatePreparationResources } from '../controllers/interviewController.js';
import { getJobs, createJob, updateJobStatus,deleteJob } from '../controllers/jobTrackerController.js';
import { verifyTokenMiddleware } from '../middleware/auth.js'; 
import { verifyApiKey } from "../middleware/verifyApiKey.js"; 

const router = express.Router();
const upload = multer();

router.post('/matcher', matcher);
router.post('/matcherE',verifyApiKey, matcherEnterprise);
router.get("/getResumeMatchResults", getResumeMatchResults);
router.post('/stats', upload.single('resume'),verifyTokenMiddleware, stats);
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


// Add a handle job title
router.post('/automation', handleAutomationData);



export default router;
