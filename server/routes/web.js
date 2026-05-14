import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.get('/verify', authController.verifyEmail);

export default router;
