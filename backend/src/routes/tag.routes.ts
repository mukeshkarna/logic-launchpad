import express from 'express';
import { getTags, getPopularTags } from '../controllers/tag.controller';

const router = express.Router();

// Get all tags
router.get('/', getTags);

// Get popular tags
router.get('/popular', getPopularTags);

export default router;
