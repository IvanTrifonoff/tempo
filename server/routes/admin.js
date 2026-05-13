import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(isAdmin);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/logs', adminController.getActivityLogs);

export default router;
