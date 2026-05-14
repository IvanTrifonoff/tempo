import express from 'express';
import * as changelogController from '../controllers/changelogController.js';

const router = express.Router();

router.get('/latest', changelogController.getLatestChangelog);

export default router;
