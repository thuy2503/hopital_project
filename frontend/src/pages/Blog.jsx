import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../api/config';
import { BookOpen, PenTool, Calendar, User, Search, Plus, X, Heart } from 'lucide-react';

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isDoctor = user.role === 'DOCTOR';

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/posts`);
      setPosts(res.data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/posts`, newPost, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAdd(false);
      setNewPost({ title: '', content: '' });
      fetchPosts();
    } catch (error) {
      alert("Lỗi khi đăng bài: " + error.message);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-10 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             <BookOpen className="text-teal-600" size={36} /> Kiến Thức Y Khoa
          </h1>
          <p className="text-gray-500 font-medium text-lg italic">Chia sẻ từ đội ngũ chuyên gia MedPro Sài Gòn.</p>
        </div>

        {isDoctor && (
          <button 
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 transform hover:-translate-y-1"
          >
            <Plus size={20} /> Viết bài mới
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {posts.map(post => (
          <article key={post.id} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-teal-100 transition-all group flex flex-col h-full">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                   {post.author?.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">{post.author?.name}</p>
                  <p className="text-[10px] text-teal-600 font-black uppercase tracking-widest">{post.author?.specialty || 'BÁC SĨ'}</p>
                </div>
                <div className="ml-auto text-gray-300 group-hover:text-teal-500 transition-colors">
                   <Heart size={20} />
                </div>
             </div>
             
             <h2 className="text-2xl font-extrabold text-gray-900 mb-4 line-clamp-2 leading-tight group-hover:text-teal-600 transition-colors">
               {post.title}
             </h2>
             
             <p className="text-gray-500 font-medium line-clamp-4 leading-relaxed flex-grow">
               {post.content}
             </p>
             
             <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-bold">
                   <Calendar size={14} />
                   {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                </div>
                <button className="text-teal-600 font-bold text-sm hover:underline">Đọc toàn bộ →</button>
             </div>
          </article>
        ))}

        {posts.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-200">
             <PenTool size={64} className="mx-auto text-gray-200 mb-6" />
             <h3 className="text-2xl font-black text-gray-400">Chưa có bài viết nào được đăng tải.</h3>
          </div>
        )}
      </div>

      {/* Write Blog Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
               <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Soạn thảo Kiến thức</h3>
               <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-red-500 bg-white p-2 rounded-full shadow-sm"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
               <div className="space-y-2">
                  <label className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Tiêu đề bài viết</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="VD: Bí quyết chăm sóc tim mạch tại gia..." 
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-teal-500 rounded-2xl outline-none transition-all font-bold text-gray-900 text-xl" 
                    value={newPost.title} 
                    onChange={e => setNewPost({...newPost, title: e.target.value})} 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Nội dung chuyên môn</label>
                  <textarea 
                    required 
                    rows="8" 
                    placeholder="Viết những lời dặn dò, kiến thức bạn muốn chia sẻ..." 
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-teal-500 rounded-2xl outline-none transition-all font-medium text-gray-700 leading-relaxed" 
                    value={newPost.content} 
                    onChange={e => setNewPost({...newPost, content: e.target.value})}
                  ></textarea>
               </div>
               
               <div className="flex justify-end pt-4">
                  <button type="submit" className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black tracking-wide hover:bg-black transition-all shadow-xl shadow-gray-200 transform hover:-translate-y-1">
                    XUẤT BẢN BÀI VIẾT
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blog;
