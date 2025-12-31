import express from 'express';
import * as usersController from '../controllers/usersController.js';
import * as tracksController from '../controllers/tracksController.js'; // Favorites logic
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Admin routes
router.get('/', authenticateToken, usersController.getAllUsers);
router.delete('/:id', authenticateToken, usersController.deleteUser);
router.patch('/:id', authenticateToken, usersController.updateUser);

// User/Favorites routes (technically user related)
router.post('/favorites', authenticateToken, tracksController.toggleFavorite);

export default router;
