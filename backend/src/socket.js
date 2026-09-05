import { Server } from 'socket.io';
import { prisma } from './index.js';

let io;
const userSockets = new Map(); // userId -> socketId

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Cấu hình chi tiết hơn trong thực tế
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('⚡ Một người dùng đã kết nối:', socket.id);

    // Người dùng đăng ký sau khi kết nối
    socket.on('register', (userId) => {
      userSockets.set(Number(userId), socket.id);
      console.log(`👤 Người dùng ${userId} đã đăng ký với socket ${socket.id}`);
    });

    // Xử lý gửi tin nhắn
    socket.on('send_message', async (data) => {
      const { senderId, receiverId, content } = data;
      console.log(`📩 Tin nhắn từ ${senderId} tới ${receiverId}: ${content}`);

      try {
        // 1. Lưu vào Database
        const message = await prisma.message.create({
          data: {
            content,
            senderId: Number(senderId),
            receiverId: Number(receiverId),
          },
          include: {
            sender: { select: { name: true } }
          }
        });

        // 2. Gửi tới người nhận (nếu đang online)
        const receiverSocketId = userSockets.get(Number(receiverId));
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', message);
        }

        // 3. Gửi lại cho người gửi để xác nhận (hoặc cập nhật UI)
        socket.emit('message_sent', message);

      } catch (error) {
        console.error('❌ Lỗi khi xử lý tin nhắn:', error);
        socket.emit('error', { message: 'Không thể gửi tin nhắn.' });
      }
    });

    socket.on('disconnect', () => {
      // Xóa socket khỏi Map
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`👋 Người dùng ${userId} đã ngắt kết nối`);
          break;
        }
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io chưa được khởi tạo!');
  }
  return io;
};

export const sendNotificationToUser = (userId, notification) => {
  if (!io) return;
  const socketId = userSockets.get(Number(userId));
  const payload = { id: Date.now(), timestamp: new Date(), ...notification };
  if (socketId) {
    io.to(socketId).emit('notification', payload);
  }
};

export const broadcastNotification = (notification) => {
  if (!io) return;
  const payload = { id: Date.now(), timestamp: new Date(), ...notification };
  io.emit('notification', payload);
};
