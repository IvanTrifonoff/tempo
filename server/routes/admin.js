import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/users', authenticateToken, adminController.getUsers);
router.delete('/users/:id', authenticateToken, adminController.deleteUser);
router.patch('/users/:id', authenticateToken, adminController.updateUser);

export default router;
