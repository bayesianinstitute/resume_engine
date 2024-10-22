import { Router } from 'express';
import { Login,completeUser,logout, ForgotRequest, ResetPassword, getUser} from '../controllers/user.js';
import { verifyTokenMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', Login);
router.get('/',verifyTokenMiddleware,getUser);
router.post('/signup',completeUser);
router.post('/forgot', ForgotRequest )
router.put('/forgot-finish', ResetPassword)
router.get('/logout',logout )

export default router;
