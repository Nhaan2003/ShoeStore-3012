const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const { formatCurrency } = require('../utils/helpers');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail(to, subject, html) {
    try {
      const mailOptions = {
        from: `"Shoe Store" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent:', info.messageId);
      return info;
    } catch (error) {
      logger.error('Send email error:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email, fullName) {
    const subject = 'Chào mừng bạn đến với Shoe Store!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .button { display: inline-block; padding: 12px 30px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Chào mừng đến với Shoe Store!</h1>
          </div>
          <div class="content">
            <h2>Xin chào ${fullName},</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại Shoe Store. Chúng tôi rất vui được phục vụ bạn!</p>
            <p>Với tài khoản này, bạn có thể:</p>
            <ul>
              <li>Mua sắm nhanh chóng và dễ dàng</li>
              <li>Theo dõi đơn hàng của mình</li>
              <li>Lưu sản phẩm yêu thích</li>
              <li>Nhận ưu đãi độc quyền</li>
            </ul>
            <p style="text-align: center; margin-top: 30px;">
              <a href="${process.env.CLIENT_URL}" class="button">Bắt đầu mua sắm</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2024 Shoe Store. All rights reserved.</p>
            <p>Nếu bạn cần hỗ trợ, vui lòng liên hệ: support@shoestore.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }

  async sendOrderConfirmationEmail(email, orderCode, orderItems, totalAmount) {
    const subject = `Xác nhận đơn hàng #${orderCode}`;
    
    let itemsHtml = '';
    orderItems.forEach(item => {
      itemsHtml += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">
            ${item.variant.product.product_name} - Size ${item.variant.size} - ${item.variant.color}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
            ${formatCurrency(item.subtotal)}
          </td>
        </tr>
      `;
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .order-info { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Xác nhận đơn hàng</h1>
          </div>
          <div class="content">
            <h2>Cảm ơn bạn đã đặt hàng!</h2>
            <p>Đơn hàng <strong>#${orderCode}</strong> của bạn đã được tiếp nhận và đang được xử lý.</p>
            
            <div class="order-info">
              <h3>Chi tiết đơn hàng:</h3>
              <table>
                <thead>
                  <tr>
                    <th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd;">Sản phẩm</th>
                    <th style="text-align: center; padding: 10px; border-bottom: 2px solid #ddd;">Số lượng</th>
                    <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 10px; text-align: right;"><strong>Tổng cộng:</strong></td>
                    <td style="padding: 10px; text-align: right;"><strong>${formatCurrency(totalAmount)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <p>Bạn có thể theo dõi đơn hàng của mình bằng cách đăng nhập vào tài khoản.</p>
          </div>
          <div class="footer">
            <p>© 2024 Shoe Store. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }

  async sendPasswordResetEmail(email, resetToken) {
    const subject = 'Đặt lại mật khẩu - Shoe Store';
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 30px; background-color: #e74c3c; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Đặt lại mật khẩu</h1>
          </div>
          <div class="content">
            <h2>Xin chào,</h2>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            <p>Nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
            </p>
            <p>Link này sẽ hết hạn sau 1 giờ.</p>
            <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          </div>
          <div class="footer">
            <p>© 2024 Shoe Store. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }

  async sendOrderStatusUpdateEmail(email, orderCode, newStatus) {
    const statusMessages = {
      confirmed: 'đã được xác nhận',
      processing: 'đang được xử lý',
      shipped: 'đã được giao cho đơn vị vận chuyển',
      delivered: 'đã được giao thành công',
      cancelled: 'đã bị hủy'
    };

    const subject = `Cập nhật đơn hàng #${orderCode}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .status-box { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Cập nhật đơn hàng</h1>
          </div>
          <div class="content">
            <h2>Thông báo về đơn hàng #${orderCode}</h2>
            <div class="status-box">
              <p>Đơn hàng của bạn <strong>${statusMessages[newStatus]}</strong>.</p>
            </div>
            <p>Bạn có thể theo dõi chi tiết đơn hàng bằng cách đăng nhập vào tài khoản của mình.</p>
          </div>
          <div class="footer">
            <p>© 2024 Shoe Store. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }
}

module.exports = new EmailService();