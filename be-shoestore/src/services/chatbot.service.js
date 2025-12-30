const { ChatSession, ChatMessage, Product, ProductVariant, Brand, Category } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { CHAT_INTENT } = require('../utils/constants');

class ChatbotService {
  async createSession(userId = null) {
    try {
      const session = await ChatSession.create({
        user_id: userId
      });
      
      return session;
    } catch (error) {
      logger.error('Create chat session error:', error);
      throw error;
    }
  }

  async processMessage(sessionId, messageText, userId = null) {
    try {
      // Save user message
      await ChatMessage.create({
        session_id: sessionId,
        sender_type: 'user',
        message_text: messageText
      });

      // Analyze intent and extract entities
      const { intent, entities } = await this.analyzeMessage(messageText);

      // Generate response based on intent
      let response;
      let products = [];

      switch (intent) {
        case CHAT_INTENT.SEARCH_PRODUCT:
          const searchResult = await this.searchProducts(entities);
          products = searchResult.products;
          response = searchResult.message;
          break;

        case CHAT_INTENT.ASK_SIZE:
          response = await this.getSizeGuide(entities);
          break;

        case CHAT_INTENT.ASK_PRICE:
          const priceResult = await this.getPriceInfo(entities);
          products = priceResult.products;
          response = priceResult.message;
          break;

        case CHAT_INTENT.RECOMMENDATION:
          const recommendResult = await this.getRecommendations(entities, userId);
          products = recommendResult.products;
          response = recommendResult.message;
          break;

        case CHAT_INTENT.ASK_AVAILABILITY:
          response = await this.checkAvailability(entities);
          break;

        default:
          response = await this.getGeneralResponse(messageText);
      }

      // Save bot response
      await ChatMessage.create({
        session_id: sessionId,
        sender_type: 'bot',
        message_text: response,
        intent,
        entities,
        products: products.length > 0 ? products : null
      });

      return {
        response,
        intent,
        entities,
        products
      };
    } catch (error) {
      logger.error('Process chatbot message error:', error);
      throw error;
    }
  }

  async analyzeMessage(messageText) {
    const text = messageText.toLowerCase();
    let intent = CHAT_INTENT.GENERAL;
    const entities = {};

    // Pattern matching for intents
    const patterns = {
      search: /tìm|find|muốn mua|looking for|search|cần/i,
      size: /size|kích cỡ|cỡ|số/i,
      price: /giá|price|bao nhiêu|cost|rẻ|đắt/i,
      availability: /còn hàng|có sẵn|available|stock|hết hàng/i,
      recommendation: /gợi ý|suggest|recommend|nên mua|tư vấn/i
    };

    // Detect intent
    if (patterns.search.test(text)) {
      intent = CHAT_INTENT.SEARCH_PRODUCT;
    } else if (patterns.size.test(text)) {
      intent = CHAT_INTENT.ASK_SIZE;
    } else if (patterns.price.test(text)) {
      intent = CHAT_INTENT.ASK_PRICE;
    } else if (patterns.availability.test(text)) {
      intent = CHAT_INTENT.ASK_AVAILABILITY;
    } else if (patterns.recommendation.test(text)) {
      intent = CHAT_INTENT.RECOMMENDATION;
    }

    // Extract entities
    // Brand extraction
    const brands = await Brand.findAll({ attributes: ['brand_name'] });
    for (const brand of brands) {
      if (text.includes(brand.brand_name.toLowerCase())) {
        entities.brand = brand.brand_name;
        break;
      }
    }

    // Gender extraction
    if (/nam|men|male|boy/i.test(text)) {
      entities.gender = 'male';
    } else if (/nữ|women|female|girl/i.test(text)) {
      entities.gender = 'female';
    }

    // Size extraction
    const sizeMatch = text.match(/size\s*(\d{2})|(\d{2})\s*(?:eu|us|uk)?/i);
    if (sizeMatch) {
      entities.size = sizeMatch[1] || sizeMatch[2];
    }

    // Color extraction
    const colors = ['đen', 'trắng', 'xanh', 'đỏ', 'vàng', 'black', 'white', 'blue', 'red', 'yellow'];
    for (const color of colors) {
      if (text.includes(color)) {
        entities.color = color;
        break;
      }
    }

    // Price range extraction
    const priceMatch = text.match(/(\d+)\s*(?:triệu|tr|million|k)/gi);
    if (priceMatch) {
      entities.priceRange = priceMatch[0];
    }

    // Product type extraction
    const types = ['sneaker', 'giày thể thao', 'boot', 'sandal', 'dép'];
    for (const type of types) {
      if (text.includes(type)) {
        entities.productType = type;
        break;
      }
    }

    return { intent, entities };
  }

  async searchProducts(entities) {
    try {
      const where = { status: 'active' };
      const include = [
        {
          model: Brand,
          as: 'brand'
        },
        {
          model: Category,
          as: 'category'
        },
        {
          model: ProductVariant,
          as: 'variants',
          where: { status: 'active' },
          required: true
        },
        {
          model: ProductImage,
          as: 'images',
          where: { is_primary: true },
          required: false
        }
      ];

      // Apply filters based on entities
      if (entities.brand) {
        include[0].where = { brand_name: entities.brand };
      }

      if (entities.gender) {
        where.gender = entities.gender;
      }

      if (entities.productType) {
        where.product_type = { [Op.like]: `%${entities.productType}%` };
      }

      if (entities.size) {
        include[2].where.size = entities.size;
      }

      if (entities.color) {
        include[2].where.color = { [Op.like]: `%${entities.color}%` };
      }

      const products = await Product.findAll({
        where,
        include,
        limit: 5
      });

      let message;
      if (products.length > 0) {
        message = `Tôi tìm thấy ${products.length} sản phẩm phù hợp với yêu cầu của bạn:`;
      } else {
        message = 'Xin lỗi, tôi không tìm thấy sản phẩm nào phù hợp với yêu cầu của bạn. Bạn có thể thử tìm kiếm với các tiêu chí khác.';
      }

      return {
        message,
        products: products.map(p => ({
          product_id: p.product_id,
          name: p.product_name,
          brand: p.brand.brand_name,
          price: p.variants[0].price,
          image: p.images[0]?.image_url
        }))
      };
    } catch (error) {
      logger.error('Search products in chatbot error:', error);
      return {
        message: 'Có lỗi xảy ra khi tìm kiếm sản phẩm. Vui lòng thử lại.',
        products: []
      };
    }
  }

  async getSizeGuide(entities) {
    const sizeGuide = {
      male: {
        '39': 'EU 39 = US 6.5 = UK 6 = 24.5cm',
        '40': 'EU 40 = US 7 = UK 6.5 = 25cm',
        '41': 'EU 41 = US 8 = UK 7.5 = 26cm',
        '42': 'EU 42 = US 8.5 = UK 8 = 26.5cm',
        '43': 'EU 43 = US 9.5 = UK 9 = 27.5cm',
        '44': 'EU 44 = US 10 = UK 9.5 = 28cm'
      },
      female: {
        '35': 'EU 35 = US 5 = UK 2.5 = 22cm',
        '36': 'EU 36 = US 5.5 = UK 3 = 22.5cm',
        '37': 'EU 37 = US 6.5 = UK 4 = 23.5cm',
        '38': 'EU 38 = US 7 = UK 5 = 24cm',
        '39': 'EU 39 = US 8 = UK 6 = 25cm',
        '40': 'EU 40 = US 8.5 = UK 6.5 = 25.5cm'
      }
    };

    let message = 'Dưới đây là bảng quy đổi size giày:\n\n';
    
    if (entities.gender === 'male') {
      message += '**Size giày nam:**\n';
      Object.entries(sizeGuide.male).forEach(([size, info]) => {
        message += `• ${info}\n`;
      });
    } else if (entities.gender === 'female') {
      message += '**Size giày nữ:**\n';
      Object.entries(sizeGuide.female).forEach(([size, info]) => {
        message += `• ${info}\n`;
      });
    } else {
      message += '**Size giày nam:**\n';
      Object.entries(sizeGuide.male).slice(0, 3).forEach(([size, info]) => {
        message += `• ${info}\n`;
      });
      message += '\n**Size giày nữ:**\n';
      Object.entries(sizeGuide.female).slice(0, 3).forEach(([size, info]) => {
        message += `• ${info}\n`;
      });
    }

    message += '\n💡 Lưu ý: Bạn nên đo chiều dài bàn chân và chọn size lớn hơn 0.5-1cm để đảm bảo thoải mái.';

    return message;
  }

  async getRecommendations(entities, userId) {
    try {
      let products = [];
      let message = '';

      // Get user's purchase history if logged in
      if (userId) {
        // Implementation for personalized recommendations
      }

      // General recommendations based on entities
      const where = { status: 'active' };
      const include = [
        { model: Brand, as: 'brand' },
        { model: Category, as: 'category' },
        { 
          model: ProductVariant, 
          as: 'variants',
          where: { status: 'active' }
        },
        {
          model: ProductImage,
          as: 'images',
          where: { is_primary: true },
          required: false
        }
      ];

      if (entities.gender) {
        where.gender = entities.gender;
      }

      // Get best sellers
      products = await Product.findAll({
        where,
        include,
        order: [['view_count', 'DESC']],
        limit: 5
      });

      if (products.length > 0) {
        message = 'Dựa trên yêu cầu của bạn, tôi xin gợi ý một số sản phẩm bán chạy:';
      } else {
        message = 'Tôi chưa có đủ thông tin để gợi ý. Bạn có thể cho tôi biết thêm về sở thích hoặc nhu cầu của bạn không?';
      }

      return {
        message,
        products: products.map(p => ({
          product_id: p.product_id,
          name: p.product_name,
          brand: p.brand.brand_name,
          price: p.variants[0].price,
          image: p.images[0]?.image_url
        }))
      };
    } catch (error) {
      logger.error('Get recommendations error:', error);
      return {
        message: 'Có lỗi xảy ra khi lấy gợi ý sản phẩm.',
        products: []
      };
    }
  }

  async getGeneralResponse(messageText) {
    const responses = {
      greeting: [
        'Xin chào! Tôi là trợ lý mua sắm của Shoe Store. Tôi có thể giúp bạn tìm kiếm giày, tư vấn size, hoặc gợi ý sản phẩm phù hợp. Bạn cần hỗ trợ gì?',
        'Chào bạn! Tôi sẵn sàng giúp bạn tìm đôi giày hoàn hảo. Bạn đang tìm kiếm loại giày nào?'
      ],
      thanks: [
        'Rất vui được giúp đỡ bạn! Nếu cần thêm hỗ trợ, đừng ngần ngại hỏi nhé.',
        'Không có gì! Chúc bạn mua sắm vui vẻ!'
      ],
      help: [
        'Tôi có thể giúp bạn:\n• Tìm kiếm giày theo thương hiệu, màu sắc, size\n• Tư vấn chọn size phù hợp\n• Gợi ý sản phẩm theo nhu cầu\n• Kiểm tra tình trạng còn hàng\n• Thông tin về giá cả\n\nBạn muốn tôi hỗ trợ vấn đề gì?'
      ],
      default: [
        'Tôi chưa hiểu rõ yêu cầu của bạn. Bạn có thể nói rõ hơn hoặc thử:\n• "Tìm giày Nike nam size 42"\n• "Giày chạy bộ giá dưới 2 triệu"\n• "Tư vấn size giày nữ"'
      ]
    };

    const text = messageText.toLowerCase();
    
    if (/xin chào|hello|hi|chào/i.test(text)) {
      return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
    } else if (/cảm ơn|thanks|thank you/i.test(text)) {
      return responses.thanks[Math.floor(Math.random() * responses.thanks.length)];
    } else if (/giúp|help|hỗ trợ/i.test(text)) {
      return responses.help[0];
    } else {
      return responses.default[0];
    }
  }

  async getChatHistory(sessionId, limit = 50) {
    try {
      const messages = await ChatMessage.findAll({
        where: { session_id: sessionId },
        order: [['timestamp', 'DESC']],
        limit
      });

      return messages.reverse();
    } catch (error) {
      logger.error('Get chat history error:', error);
      throw error;
    }
  }

  async endSession(sessionId) {
    try {
      await ChatSession.update(
        { 
          status: 'ended',
          ended_at: new Date()
        },
        { where: { session_id: sessionId } }
      );

      return true;
    } catch (error) {
      logger.error('End chat session error:', error);
      throw error;
    }
  }
}

module.exports = new ChatbotService();