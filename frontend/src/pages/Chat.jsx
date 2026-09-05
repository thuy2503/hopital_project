import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { io } from 'socket.io-client';
import ChatBubble from '../components/ChatBubble';
import { Send, User, MessageCircle, ArrowLeft } from 'lucide-react';

const Chat = () => {
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const scrollRef = useRef();
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token && user?.id) {
      // 1. Kết nối Socket.io
      const newSocket = io(API_BASE_URL);
      socketRef.current = newSocket;

      // Đăng ký user với socket
      newSocket.emit('register', user.id);

      // Lắng nghe tin nhắn mới
      newSocket.on('receive_message', (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      // Lắng nghe xác nhận gửi tin nhắn thành công
      newSocket.on('message_sent', (msg) => {
        setMessages((prev) => [...prev, msg]);
      });

      // 2. Tải danh sách liên hệ
      axios.get(`${API_BASE_URL}/api/chat/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setContacts(res.data))
      .catch(err => console.error(err));

      return () => newSocket.close();
    }
  }, [user?.id]);

  // Cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Tải lịch sử chat khi chọn liên hệ
  useEffect(() => {
    if (selectedContact) {
      const token = localStorage.getItem('token');
      axios.get(`${API_BASE_URL}/api/chat/history/${selectedContact.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setMessages(res.data))
      .catch(err => console.error(err));
    }
  }, [selectedContact]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedContact || !socketRef.current) return;

    const data = {
      senderId: user.id,
      receiverId: selectedContact.id,
      content: input
    };

    socketRef.current.emit('send_message', data);
    setInput('');
  };

  return (
    <div className="flex h-screen bg-gray-50 pt-16">
      {/* Sidebar - Danh sách liên hệ */}
      <div className={`w-full md:w-80 bg-white border-r border-gray-200 flex flex-col ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <MessageCircle className="text-blue-600" size={24} />
            Tin nhắn
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`p-4 flex items-center gap-3 cursor-pointer transition-all hover:bg-blue-50/50 ${
                selectedContact?.id === contact.id ? 'bg-blue-50 border-r-4 border-blue-600 shadow-sm' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden border border-blue-200 shadow-sm">
                {contact.imageUrl ? (
                  <img src={contact.imageUrl} alt={contact.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={24} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{contact.name}</p>
                {contact.specialty && (
                  <p className="text-xs text-gray-500 truncate">{contact.specialty}</p>
                )}
              </div>
            </div>
          ))}
          {contacts.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <p>Chưa có danh sách liên hệ</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-white ${!selectedContact ? 'hidden md:flex items-center justify-center bg-gray-50' : 'flex'}`}>
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
              <button 
                onClick={() => setSelectedContact(null)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-full text-gray-500"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                <User size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-800">{selectedContact.name}</p>
                <p className="text-[10px] text-green-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Đang hoạt động
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50/30">
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isMine={msg.senderId === user?.id}
                />
              ))}
              <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2 max-w-4xl mx-auto">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 p-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center p-8 space-y-4">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
              <MessageCircle size={40} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Bắt đầu trò chuyện</h3>
              <p className="text-gray-500 max-w-xs mx-auto mt-2">
                Chọn một bác sĩ hoặc bệnh nhân từ danh sách bên trái để bắt đầu tư vấn trực tuyến.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
