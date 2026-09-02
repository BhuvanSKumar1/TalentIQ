import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  searchController,
  searchSuggestionsController,
  saveSearchController,
  getSavedSearchesController,
  deleteSavedSearchController,
} from '../../controllers/search.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Search candidates with natural language
router.get('/', searchController);

// Get search suggestions
router.get('/suggestions', searchSuggestionsController);

// Saved searches
router.post('/saved', saveSearchController);
router.get('/saved', getSavedSearchesController);
router.delete('/saved/:id', deleteSavedSearchController);

export default router;
