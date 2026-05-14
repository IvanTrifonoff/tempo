import express from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, reviewController.submitReview);
router.get('/status', authenticateToken, reviewController.getReviewStatus);

router.get('/admin', authenticateToken, reviewController.getAllReviews);

export default router;
