import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  processUserMessage,
  createConversation,
  getConversation,
  getConversations,
  addMessage,
  deleteConversation,
} from '../services/ai.service';
import { metrics } from '../services/metrics.service';

export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { conversationId, message } = req.body;
    const userId = req.user?.userId || '';
    const organizationId = req.user?.organizationId || '';

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    let convId = conversationId;
    if (!convId) {
      const conv = createConversation(userId, organizationId);
      convId = conv.id;
    }

    const conv = getConversation(convId);
    if (!conv) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user' as const,
      content: message.trim(),
      timestamp: new Date(),
    };
    addMessage(convId, userMsg);

    const start = Date.now();
    const response = await processUserMessage(message.trim(), organizationId);
    metrics.recordServiceLatency('ai.chat', Date.now() - start);
    metrics.incrementCounter('ai.messages_processed');

    const assistantMsg = {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant' as const,
      content: response.message,
      toolCalls: response.toolCalls,
      toolResults: response.results,
      timestamp: new Date(),
    };
    addMessage(convId, assistantMsg);

    res.json({
      success: true,
      data: {
        conversationId: convId,
        message: assistantMsg,
        suggestedFollowUps: response.suggestedFollowUps,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listConversations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId || '';
    const organizationId = req.user?.organizationId || '';
    const convs = getConversations(userId, organizationId);

    res.json({
      success: true,
      data: convs.map(c => ({
        id: c.id,
        title: c.title,
        messageCount: c.messages.length,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getConversationMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const conv = getConversation(id);

    if (!conv) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    res.json({
      success: true,
      data: {
        id: conv.id,
        title: conv.title,
        messages: conv.messages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const removeConversation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const deleted = deleteConversation(id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
