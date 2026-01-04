import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getMe);
// Verify is handled at root level usually because of email link, but let's keep it here or separate. 
// The original server.js had /verify at root. I will move it here but note the prefix change.
// Actually, email link is domain.com/verify?token=... so it expects a frontend or backend route at root.
// Let's keep /verify at root in server.js or make a redirect.
// The controller supports it.

export default router;
