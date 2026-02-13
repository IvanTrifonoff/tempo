import express from 'express';
import * as tracksController from '../controllers/tracksController.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/', tracksController.getTracks);
router.post('/', authenticateToken, upload.single('file'), tracksController.createTrack);
router.delete('/:id', authenticateToken, tracksController.deleteTrack);
router.patch('/:id', authenticateToken, tracksController.updateTrack);
router.post('/favorite', authenticateToken, tracksController.toggleFavorite);

export default router;
