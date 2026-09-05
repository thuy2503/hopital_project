import React from 'react';

const ChatBubble = ({ message, isMine }) => {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${
          isMine
            ? 'bg-blue-600 text-white rounded-tr-none'
            : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'
        }`}
      >
        {!isMine && (
          <p className="text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">
            {message.sender?.name || 'Người gửi'}
          </p>
        )}
        <p className="text-sm leading-relaxed">{message.content}</p>
        <p
          className={`text-[9px] mt-1 ${
            isMine ? 'text-blue-100/70' : 'text-gray-400'
          } text-right`}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
};

export default ChatBubble;
