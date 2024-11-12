import { Router } from 'express';
import { getProfile,updateProfile,Login,completeUser,logout, ForgotRequest, ResetPassword, getUser} from '../controllers/user.js';
import { verifyTokenMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', Login);
router.get('/',verifyTokenMiddleware,getUser);
router.post('/signup',completeUser);
router.post('/forgot', ForgotRequest )
router.put('/forgot-finish', ResetPassword)
router.get('/logout',logout )
router.get("/profile", getProfile);  
router.put("/profile", updateProfile);  
export default router;
