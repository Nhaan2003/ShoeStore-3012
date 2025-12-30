const chatbotService = require('../services/chatbot.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

class ChatController {
  async createSession(req, res) {
    try {
      const userId = req.user ? req.user.user_id : null;
      const session = await chatbotService.createSession(userId);
      
      return successResponse(res, {
        message: 'Chat session created',
        data: session
      });
    } catch (error) {
      logger.error('Create chat session error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async sendMessage(req, res) {
    try {
      const { session_id, message } = req.body;
      const userId = req.user ? req.user.user_id : null;
      
      const response = await chatbotService.processMessage(
        session_id,
        message,
        userId
      );
      
      // Emit response through Socket.io if available
      const io = req.app.get('io');
      if (io) {
        io.to(`chat_${session_id}`).emit('bot_message', response);
      }
      
      return successResponse(res, {
        message: 'Message processed',
        data: response
      });
    } catch (error) {
      logger.error('Send message error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async getChatHistory(req, res) {
    try {
      const { sessionId } = req.params;
      const { limit = 50 } = req.query;
      
      const messages = await chatbotService.getChatHistory(sessionId, limit);
      
      return successResponse(res, {
        message: 'Chat history retrieved',
        data: messages
      });
    } catch (error) {
      logger.error('Get chat history error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async endSession(req, res) {
    try {
      const { sessionId } = req.params;
      
      await chatbotService.endSession(sessionId);
      
      return successResponse(res, {
        message: 'Chat session ended'
      });
    } catch (error) {
      logger.error('End chat session error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }

  async getChatSuggestions(req, res) {
    try {
      const suggestions = [
        'Tìm giày Nike nam size 42',
        'Giày chạy bộ dưới 2 triệu',
        'Tư vấn chọn size giày',
        'Giày thể thao nữ màu trắng',
        'Khuyến mãi hôm nay',
        'Theo dõi đơn hàng'
      ];
      
      return successResponse(res, {
        message: 'Chat suggestions retrieved',
        data: suggestions
      });
    } catch (error) {
      logger.error('Get chat suggestions error:', error);
      return errorResponse(res, error.message, error.statusCode);
    }
  }
}

module.exports = new ChatController();