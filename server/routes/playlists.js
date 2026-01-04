import express from 'express';
import * as playlistsController from '../controllers/playlistsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, playlistsController.getPlaylists);
router.post('/', authenticateToken, playlistsController.createPlaylist);
router.delete('/:id', authenticateToken, playlistsController.deletePlaylist);
router.post('/:id/tracks', authenticateToken, playlistsController.addTrackToPlaylist);
router.delete('/:id/tracks/:trackId', authenticateToken, playlistsController.removeTrackFromPlaylist);

export default router;
