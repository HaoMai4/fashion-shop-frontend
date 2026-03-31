// Chatbot API service - replace mock with real POST /api/chatbot/message later
import { ChatRequest, ChatResponse, SanPham } from '@/types';
import { sanPhamData } from '@/data/products';
import { faqData } from '@/data/faq';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock AI response logic - will be replaced by real LLM API call
function generateMockResponse(message: string): ChatResponse {
  const msg = message.toLowerCase();

  // Size consultation
  if (msg.includes('size') || msg.includes('cao') || msg.includes('nặng') || msg.includes('cân nặng')) {
    return {
      reply: 'Dựa trên thông tin của bạn, mình gợi ý size **M** hoặc **L** nhé! 📏\n\nVới chiều cao trung bình và cân nặng vừa phải, size M sẽ vừa vặn theo form slim fit, còn size L sẽ thoải mái hơn nếu bạn thích mặc rộng.\n\n💡 Mẹo: Nếu phân vân giữa 2 size, hãy chọn size lớn hơn vì vải có thể co nhẹ sau giặt.',
      suggestions: ['Xem bảng size chi tiết', 'Gợi ý sản phẩm theo size M', 'Tư vấn phối đồ'],
      type: 'size_advice'
    };
  }

  // Product recommendations
  if (msg.includes('polo') || msg.includes('áo')) {
    const products = sanPhamData.filter(p => p.danhMuc.toLowerCase().includes('polo') || p.danhMuc.toLowerCase().includes('thun')).slice(0, 3);
    return {
      reply: 'Mình tìm thấy một số mẫu áo phù hợp với bạn! 👕 Đây là những sản phẩm đang được yêu thích nhất:',
      recommendedProducts: products,
      suggestions: ['Lọc theo giá', 'Xem thêm áo thun', 'Tư vấn size'],
      type: 'product_recommendation'
    };
  }

  if (msg.includes('thể thao') || msg.includes('gym') || msg.includes('tập')) {
    const products = sanPhamData.filter(p => p.danhMuc === 'Đồ Thể Thao').slice(0, 3);
    return {
      reply: 'Bạn đang tìm đồ thể thao đúng không? 💪 MATEWEAR có nhiều lựa chọn tuyệt vời cho bạn:',
      recommendedProducts: products,
      suggestions: ['Xem set đồ tập', 'Đồ thể thao nam', 'Đồ thể thao nữ'],
      type: 'product_recommendation'
    };
  }

  if (msg.includes('sale') || msg.includes('giảm giá') || msg.includes('khuyến mãi')) {
    const products = sanPhamData.filter(p => p.giaGoc && p.giaGoc > p.gia).slice(0, 3);
    return {
      reply: 'Đây là những sản phẩm đang sale cực hot! 🔥 Nhanh tay kẻo hết nha:',
      recommendedProducts: products,
      suggestions: ['Xem tất cả sale', 'Sale áo', 'Sale quần'],
      type: 'product_recommendation'
    };
  }

  if (msg.includes('quần') || msg.includes('jean') || msg.includes('short')) {
    const products = sanPhamData.filter(p => p.danhMuc.includes('Quần')).slice(0, 3);
    return {
      reply: 'Mình gợi ý một số mẫu quần đang hot nhất hiện tại! 👖',
      recommendedProducts: products,
      suggestions: ['Quần jean', 'Quần short', 'Quần thể thao'],
      type: 'product_recommendation'
    };
  }

  // FAQ
  if (msg.includes('giao hàng') || msg.includes('ship') || msg.includes('vận chuyển')) {
    const faq = faqData.find(f => f.danhMuc === 'Vận chuyển');
    return { reply: faq?.traLoi || 'Đơn hàng tại TP.HCM sẽ được giao trong 1-2 ngày.', suggestions: ['Kiểm tra đơn hàng', 'Chính sách đổi trả', 'Thanh toán'], type: 'faq' };
  }

  if (msg.includes('đổi trả') || msg.includes('trả hàng') || msg.includes('đổi size')) {
    const faq = faqData.find(f => f.danhMuc === 'Đổi trả');
    return { reply: faq?.traLoi || 'MATEWEAR hỗ trợ đổi trả miễn phí trong 30 ngày.', suggestions: ['Liên hệ hỗ trợ', 'Xem chính sách', 'Tư vấn size'], type: 'faq' };
  }

  if (msg.includes('thanh toán') || msg.includes('trả tiền') || msg.includes('cod')) {
    const faq = faqData.find(f => f.danhMuc === 'Thanh toán');
    return { reply: faq?.traLoi || 'Chúng tôi hỗ trợ COD, chuyển khoản và ví điện tử.', suggestions: ['Mua hàng ngay', 'Xem giỏ hàng', 'Ưu đãi thành viên'], type: 'faq' };
  }

  if (msg.includes('đơn hàng') || msg.includes('hủy đơn') || msg.includes('kiểm tra đơn')) {
    return { reply: 'Để kiểm tra đơn hàng, bạn vui lòng đăng nhập và vào mục "Đơn hàng của tôi" nhé! 📦\n\nNếu cần hỗ trợ gấp, hãy gọi hotline **1900 8888** hoặc inbox fanpage MATEWEAR.', suggestions: ['Đăng nhập', 'Xem đơn hàng', 'Liên hệ hotline'], type: 'faq' };
  }

  if (msg.includes('phối đồ') || msg.includes('outfit') || msg.includes('mặc gì')) {
    const products = sanPhamData.slice(0, 3);
    return {
      reply: 'Mình gợi ý một set outfit cho bạn nhé! 🎨\n\n**Casual hàng ngày:**\n- Áo polo basic + Quần kaki slim\n- Giày sneaker trắng + Nón lưỡi trai\n\n**Sporty năng động:**\n- Áo thun oversize + Quần jogger\n- Sneaker + Balo MATEWEAR',
      recommendedProducts: products,
      suggestions: ['Outfit đi làm', 'Outfit đi chơi', 'Outfit tập gym'],
      type: 'product_recommendation'
    };
  }

  // Default greeting / general
  return {
    reply: 'Xin chào! 👋 Mình là trợ lý AI mua sắm của **MATEWEAR**. Mình có thể giúp bạn:\n\n🛍️ Gợi ý sản phẩm phù hợp\n📏 Tư vấn size dựa trên số đo\n👔 Gợi ý phối đồ\n❓ Giải đáp thắc mắc về đơn hàng, giao hàng, đổi trả\n\nBạn cần mình hỗ trợ gì nha?',
    suggestions: ['Gợi ý áo polo nam', 'Đồ thể thao nữ', 'Sản phẩm đang sale', 'Tư vấn size'],
    type: 'text'
  };
}

export const chatbotService = {
  /**
   * Send message to chatbot API
   * In production, this will call: POST /api/chatbot/message
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    await delay(1000 + Math.random() * 1000); // Simulate API latency

    // PRODUCTION: Replace with real API call:
    // const response = await fetch(`${API_BASE}/chatbot/message`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(request),
    // });
    // return response.json();

    return generateMockResponse(request.message);
  },
};
