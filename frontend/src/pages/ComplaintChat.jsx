import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { complaintsAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { MessageCircle, ArrowRight, Paperclip, X, Download, FileText } from 'lucide-react';
import { io } from 'socket.io-client';

export default function ComplaintChat() {
  const { id } = useParams();
  const { user, isAdmin } = useAuthStore();
  const [complaint, setComplaint] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isClosed, setIsClosed] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchChat();

    const socket = io('http://localhost:5000');
    socket.emit('join_complaint_room', id);

    socket.on('receive_message', (newMsg) => {
      setMessages(prev => [...prev, newMsg]);
    });

    socket.on('complaint_status_changed', (newStatus) => {
      setComplaint(prev => prev ? { ...prev, status: newStatus } : null);
      if (newStatus === 'resolved' || newStatus === 'closed') {
        setIsClosed(true);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChat = async (showLoad = true) => {
    if (showLoad) setLoading(true);
    try {
      const msgsRes = await complaintsAPI.getMessages(id);
      setMessages(msgsRes.data.data);

      if (!complaint) {
        try {
          const compRes = await complaintsAPI.getOne(id);
          if (compRes.data.data) {
            setComplaint(compRes.data.data);
            setIsClosed(compRes.data.data.status === 'resolved' || compRes.data.data.status === 'closed');
          }
        } catch (_) {
          try {
            const myRes = await complaintsAPI.getMy();
            const found = myRes.data.data.find(c => String(c.id) === String(id));
            if (found) {
              setComplaint(found);
              setIsClosed(found.status === 'resolved' || found.status === 'closed');
            }
          } catch (__) { }
        }
      }
    } catch (error) {
      if (showLoad) toast.error('فشل جلب المحادثة: ' + (error.response?.data?.message || error.message));
    } finally {
      if (showLoad) setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachment) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('message', newMessage);
    if (attachment) {
      formData.append('attachment', attachment);
    }

    try {
      // Note: API expects multipart/form-data when file is present
      await complaintsAPI.sendMessageWithAttachment(id, formData);
      setNewMessage('');
      setAttachment(null);
      // Message is received via socket.io
    } catch (error) {
      toast.error('فشل إرسال الرسالة: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الملف يجب أن لا يتجاوز 5 ميجابايت');
        return;
      }
      setAttachment(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getOtherPartyName = () => {
    if (!complaint) return '...';
    if (String(user?.id) === String(complaint.complainant_id)) {
      return complaint.against_name;
    }
    return complaint.complainant_name;
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8f9fa',
      padding: '20px'
    }}>
      <div className="card flex flex-col" style={{ height: '85vh', width: '100%', maxWidth: '900px', margin: '0 auto', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>

        {/* Header */}
        <div style={{ background: 'var(--primary)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/profile" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <ArrowRight size={20} />
            </Link>
            <div>
              <h2 style={{ color: 'white', fontWeight: 'bold', margin: 0, fontSize: '1rem' }}>
                محادثة مع {getOtherPartyName()}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', margin: 0 }}>
                الحجز #{complaint?.reservation_id || id}
              </p>
            </div>
          </div>
          {complaint && (
            <span style={{
              background: complaint.type === 'other' ? 'rgba(255,255,255,0.2)' : '#febb02',
              color: 'white',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              {complaint.type === 'other' ? 'محادثة' : 'شكوى / نزاع'}
            </span>
          )}
        </div>

        {/* Resolution info if resolved */}
        {complaint?.resolution && complaint.status === 'resolved' && (
          <div style={{ background: '#d4edda', color: '#155724', padding: '12px 20px', fontSize: '0.85rem', borderBottom: '1px solid #c3e6cb' }}>
            <strong>📋 قرار الإدارة:</strong> {complaint.resolution}
          </div>
        )}

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f5f7fa', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
              <MessageCircle size={48} style={{ marginBottom: '12px', color: 'var(--primary-light)' }} />
              <p style={{ fontWeight: 'bold' }}>لا توجد رسائل بعد</p>
              <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>ابدأ المحادثة بكتابة رسالتك أدناه</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = String(msg.sender_id) === String(user?.id);
              const isSystem = msg.message?.startsWith('[System');

              if (isSystem) {
                return (
                  <div key={idx} style={{ textAlign: 'center', padding: '4px 0' }}>
                    <span style={{
                      background: '#f0f0f0', color: '#666',
                      padding: '4px 12px', borderRadius: '20px',
                      fontSize: '0.75rem', display: 'inline-block'
                    }}>{msg.message.replace('[System]', '')}</span>
                  </div>
                );
              }

              return (
                <div key={idx} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px' }}>
                  {!isMe && (
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'var(--primary)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0
                    }}>
                      {msg.sender_name?.charAt(0)}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '65%',
                    background: isMe ? 'var(--primary)' : '#ffffff',
                    color: isMe ? 'white' : 'var(--text-main)',
                    padding: '10px 14px',
                    borderRadius: isMe ? '14px 14px 0 14px' : '14px 14px 14px 0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                  }}>
                    {!isMe && (
                      <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary-light)', marginBottom: '4px' }}>
                        {msg.sender_name}
                      </p>
                    )}
                    <p style={{ whiteSpace: 'preWrap', lineHeight: 1.5, margin: 0 }}>{msg.message}</p>
                    {msg.attachment_url && (
                      <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px',
                        fontSize: '0.75rem', color: isMe ? '#fff' : '#0a58ca', textDecoration: 'underline'
                      }}>
                        <Paperclip size={12} /> عرض المرفق
                      </a>
                    )}
                    <p style={{ fontSize: '0.7rem', marginTop: '6px', opacity: 0.6, textAlign: isMe ? 'left' : 'right' }} dir="ltr">
                      {new Date(msg.created_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input footer */}
        <div style={{ padding: '14px 16px', background: '#fff', borderTop: '1px solid var(--border)' }}>
          {isClosed ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>تم إغلاق هذه المحادثة</p>
          ) : (
            <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {attachment && (
                <div style={{ background: '#e9ecef', borderRadius: '8px', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} /> {attachment.name}
                  </span>
                  <button type="button" onClick={removeAttachment} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="اكتب رسالتك هنا..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  autoFocus
                />
                <button type="button" onClick={() => fileInputRef.current.click()} style={{
                  background: '#f1f3f5', border: '1px solid #ced4da', borderRadius: '8px',
                  padding: '0 12px', cursor: 'pointer'
                }}>
                  <Paperclip size={18} />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*,application/pdf" />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ minWidth: '80px' }}
                  disabled={(!newMessage.trim() && !attachment) || uploading}
                >
                  {uploading ? 'جاري...' : 'إرسال'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}