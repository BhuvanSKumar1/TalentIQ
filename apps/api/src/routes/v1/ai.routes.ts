import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { aiRateLimiter, preventPromptInjection } from '../../middleware/security';
import {
  sendMessage,
  listConversations,
  getConversationMessages,
  removeConversation,
} from '../../controllers/ai.controller';

const router = Router();

router.use(authenticate);

// Rate limit AI requests and prevent prompt injection
router.post('/chat', aiRateLimiter, preventPromptInjection, sendMessage);
router.get('/conversations', listConversations);
router.get('/conversations/:id', getConversationMessages);
router.delete('/conversations/:id', removeConversation);

export default router;
