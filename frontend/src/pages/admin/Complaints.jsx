import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, complaintsAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import {
  Users, LayoutDashboard, ShieldAlert, Car, Settings, MessageSquare,
  CheckCircle, Clock, AlertTriangle, X, Send, Filter, User,
  Zap, Circle, Check, AlertOctagon, MoreHorizontal, Shield, Paperclip, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { io } from 'socket.io-client';

const STATUS_MAP = {
  open: { label: 'مفتوح', icon: AlertTriangle, color: '#dc3545' },
  in_progress: { label: 'جارٍ', icon: Clock, color: '#ffc107' },
  resolved: { label: 'محلول', icon: CheckCircle, color: '#28a745' },
  closed: { label: 'مغلق', icon: Circle, color: '#6c757d' },
};

const TYPE_MAP = {
  other: 'محادثة',
  damage: 'أضرار',
  payment: 'دفع',
  service: 'خدمة',
  late_return: 'تأخر إرجاع',
};

export default function AdminComplaints() {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [resolution, setResolution] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    if (selectedComplaint) {
      fetchMessages(selectedComplaint.id);

      const socket = io('http://localhost:5000');
      socket.emit('join_complaint_room', selectedComplaint.id);

      socket.on('receive_message', (newMsg) => {
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      });

      socket.on('complaint_status_changed', (newStatus) => {
        const targetId = selectedComplaint.id;
        setSelectedComplaint(prev => prev ? { ...prev, status: newStatus } : null);
        setComplaints(prev => prev.map(c => c.id === targetId ? { ...c, status: newStatus } : c));
      });

      return () => socket.disconnect();
    }
  }, [selectedComplaint]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchComplaints = async () => {
    try {
      const res = await adminAPI.getComplaints();
      setComplaints(res.data.data);
    } catch (error) {
      toast.error('فشل جلب الشكاوى');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (id, showLoad = true) => {
    if (showLoad) setChatLoading(true);
    try {
      const res = await complaintsAPI.getMessages(id);
      setMessages(res.data.data);
    } catch (error) {
      // silent
    } finally {
      if (showLoad) setChatLoading(false);
    }
  };

  const openComplaint = (c) => {
    setSelectedComplaint(c);
    setShowResolveForm(false);
    setResolution('');
    fetchMessages(c.id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachment) return;
    setSendingMessage(true);
    setUploading(true);
    const formData = new FormData();
    formData.append('message', newMessage);
    if (attachment) formData.append('attachment', attachment);
    try {
      await complaintsAPI.sendMessageWithAttachment(selectedComplaint.id, formData);
      setNewMessage('');
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل الإرسال');
    } finally {
      setSendingMessage(false);
      setUploading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedComplaint) return;
    if (newStatus === 'resolved' && !resolution.trim()) {
      return toast.error('يرجى كتابة قرار الحل أولاً');
    }
    if (!window.confirm(`هل أنت متأكد من تغيير حالة الشكوى إلى "${STATUS_MAP[newStatus]?.label}"؟`)) return;
    setUpdatingStatus(true);
    try {
      await adminAPI.resolveComplaint(selectedComplaint.id, {
        status: newStatus,
        resolution: resolution || `تم تغيير الحالة إلى ${STATUS_MAP[newStatus]?.label} بواسطة الإدارة`
      });
      toast.success('تم تحديث حالة الشكوى بنجاح');
      setShowResolveForm(false);
      setResolution('');
      const updated = { ...selectedComplaint, status: newStatus };
      setSelectedComplaint(updated);
      setComplaints(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch (error) {
      toast.error(error.response?.data?.message || 'فشل التحديث');
    } finally {
      setUpdatingStatus(false);
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

  const filtered = filter === 'all' ? complaints : complaints.filter(c => c.status === filter);
  const getStatusIcon = (status) => {
    const Icon = STATUS_MAP[status]?.icon || Circle;
    return <Icon size={14} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8f9fa' }}>
      <div className="sidebar" style={{ width: '260px', background: 'white', borderLeft: '1px solid #e9ecef', padding: '24px 0', position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 100 }}>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Link to="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <LayoutDashboard size={20} /> الإحصائيات
          </Link>
          <Link to="/admin/users" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <Users size={20} /> المستخدمين
          </Link>
          <Link to="/admin/cars" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <Car size={20} /> السيارات
          </Link>
          <Link to="/admin/complaints" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', background: '#e9ecef', color: '#0a58ca', fontWeight: 'bold', textDecoration: 'none' }}>
            <ShieldAlert size={20} /> الشكاوى
          </Link>
          <Link to="/admin/settings" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', color: '#1a1a1a', textDecoration: 'none' }}>
            <Settings size={20} /> الإعدادات
          </Link>
        </div>
      </div>

      <div style={{ marginRight: '260px', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#f8f9fa' }}>

          {/* Left panel */}
          <div style={{
            width: selectedComplaint ? '380px' : '100%',
            borderLeft: '1px solid #e9ecef',
            overflowY: 'auto',
            flexShrink: 0,
            transition: 'width 0.3s',
            background: 'white',
            boxShadow: selectedComplaint ? '2px 0 8px rgba(0,0,0,0.05)' : 'none'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e9ecef', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h1 style={{ fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', gap: '8px', alignItems: 'center', margin: 0 }}>
                  <ShieldAlert size={22} color="#dc3545" /> إدارة الشكاوى
                </h1>
                <span style={{ background: '#dc3545', color: 'white', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                  {complaints.filter(c => c.status === 'open').length} مفتوح
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['all', 'open', 'in_progress', 'resolved', 'closed'].map(s => {
                  const statusInfo = STATUS_MAP[s];
                  const label = s === 'all' ? 'الكل' : statusInfo?.label;
                  const count = s === 'all' ? complaints.length : complaints.filter(c => c.status === s).length;
                  return (
                    <button key={s} onClick={() => setFilter(s)} style={{
                      background: filter === s ? '#0a58ca' : '#e9ecef',
                      color: filter === s ? 'white' : '#1a1a1a',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: filter === s ? 'bold' : 'normal'
                    }}>
                      {label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}><div className="spinner"></div></div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#6c757d' }}>
                <ShieldAlert size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p>لا توجد {filter !== 'all' ? STATUS_MAP[filter]?.label : ''} شكاوى</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filtered.map(c => {
                  const StatusIcon = STATUS_MAP[c.status]?.icon || Circle;
                  return (
                    <div key={c.id} onClick={() => openComplaint(c)} style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid #e9ecef',
                      cursor: 'pointer',
                      background: selectedComplaint?.id === c.id ? 'rgba(13,110,253,0.05)' : 'transparent',
                      borderRight: selectedComplaint?.id === c.id ? '3px solid #0a58ca' : '3px solid transparent',
                      transition: 'all 0.15s'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '0.85rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {c.title}
                        </p>
                        <span style={{
                          background: STATUS_MAP[c.status]?.color || '#6c757d',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '20px',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <StatusIcon size={10} /> {STATUS_MAP[c.status]?.label || c.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.7rem', color: '#6c757d' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} /> {c.complainant_name}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Zap size={12} /> {TYPE_MAP[c.type] || c.type}</span>
                      </div>
                      <p style={{ fontSize: '0.65rem', color: '#6c757d', marginTop: '6px' }}>
                        {c.created_at ? format(new Date(c.created_at), 'yyyy-MM-dd HH:mm') : '---'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right panel - chat */}
          {selectedComplaint && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#f8f9fa' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #e9ecef', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                      <MessageSquare size={18} color="#0a58ca" />
                      {selectedComplaint.title}
                      <span style={{
                        background: STATUS_MAP[selectedComplaint.status]?.color || '#6c757d',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {getStatusIcon(selectedComplaint.status)}
                        {STATUS_MAP[selectedComplaint.status]?.label}
                      </span>
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: '#6c757d', margin: 0 }}>
                      المُشتكي: <strong>{selectedComplaint.complainant_name}</strong> |
                      ضد: <strong>{selectedComplaint.against_name}</strong> |
                      النوع: <strong>{TYPE_MAP[selectedComplaint.type] || selectedComplaint.type}</strong>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedComplaint.status !== 'resolved' && selectedComplaint.status !== 'closed' && (
                      <>
                        <button onClick={() => handleUpdateStatus('in_progress')} disabled={updatingStatus} style={{
                          background: '#ffc107',
                          color: '#1a1a1a',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          cursor: updatingStatus ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <Clock size={14} /> تحويل لـ "جارٍ"
                        </button>
                        <button onClick={() => setShowResolveForm(!showResolveForm)} style={{
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <CheckCircle size={14} /> حل النزاع
                        </button>
                      </>
                    )}
                    <button onClick={() => setSelectedComplaint(null)} style={{
                      background: 'none',
                      border: '1px solid #e9ecef',
                      borderRadius: '6px',
                      padding: '6px',
                      cursor: 'pointer'
                    }}>
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {showResolveForm && (
                  <div style={{ marginTop: '16px', padding: '16px', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #28a745' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#28a745', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={14} /> قرار حل النزاع
                    </p>
                    <textarea
                      rows="3"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontFamily: 'inherit', marginBottom: '8px' }}
                      placeholder="اكتب قرار الإدارة بشأن هذا النزاع بوضوح... (سيظهر للطرفين)"
                      value={resolution}
                      onChange={e => setResolution(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleUpdateStatus('resolved')} disabled={updatingStatus} style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: updatingStatus ? 'not-allowed' : 'pointer',
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <CheckCircle size={14} /> تأكيد الحل وإغلاق النزاع
                      </button>
                      <button onClick={() => setShowResolveForm(false)} style={{
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}>
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {chatLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><div className="spinner"></div></div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#6c757d', marginTop: 'auto', marginBottom: 'auto' }}>
                    <MessageSquare size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p>لا توجد رسائل في هذا النزاع بعد</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isAdmin = msg.sender_role === 'admin';
                    const isSystem = msg.message?.startsWith('[System]');
                    const actualMessage = isSystem ? msg.message.replace('[System] ', '') : msg.message;

                    if (isSystem) {
                      return (
                        <div key={idx} style={{ textAlign: 'center' }}>
                          <span style={{ background: '#e8f4fd', color: '#0a58ca', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', display: 'inline-block', fontWeight: 'bold' }}>
                            {actualMessage}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start', gap: '8px', alignItems: 'flex-end' }}>
                        {!isAdmin && (
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: msg.sender_role === 'supplier' ? '#fd7e14' : '#6f42c1',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 'bold', fontSize: '0.8rem', flexShrink: 0
                          }}>
                            {msg.sender_name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div style={{
                          maxWidth: '65%',
                          background: isAdmin ? '#0a58ca' : 'white',
                          color: isAdmin ? 'white' : '#1a1a1a',
                          padding: '10px 14px',
                          borderRadius: isAdmin ? '14px 14px 0 14px' : '14px 14px 14px 0',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                          {!isAdmin && (
                            <p style={{ fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '4px', color: msg.sender_role === 'supplier' ? '#fd7e14' : '#6f42c1' }}>
                              {msg.sender_name} ({msg.sender_role === 'supplier' ? 'مورد' : 'عميل'})
                            </p>
                          )}
                          {isAdmin && (
                            <p style={{ fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '4px', color: 'rgba(255,255,255,0.8)' }}>
                              <Shield size={12} style={{ display: 'inline', marginLeft: '4px' }} /> الإدارة
                            </p>
                          )}
                          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, margin: 0, fontSize: '0.85rem' }}>{actualMessage}</p>
                          {msg.attachment_url && (
                            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px',
                              fontSize: '0.75rem', color: isAdmin ? '#fff' : '#0a58ca', textDecoration: 'underline'
                            }}>
                              <Paperclip size={12} /> عرض المرفق
                            </a>
                          )}
                          <p style={{ fontSize: '0.65rem', marginTop: '6px', opacity: 0.6, textAlign: isAdmin ? 'left' : 'right' }} dir="ltr">
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ padding: '14px 20px', background: 'white', borderTop: '1px solid #e9ecef' }}>
                {selectedComplaint.status === 'resolved' || selectedComplaint.status === 'closed' ? (
                  <p style={{ textAlign: 'center', color: '#6c757d', fontSize: '0.8rem' }}>
                    <CheckCircle size={14} style={{ display: 'inline', marginLeft: '4px' }} /> تم إغلاق هذا النزاع — لا يمكن إضافة رسائل جديدة
                  </p>
                ) : (
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {attachment && (
                      <div style={{ background: '#e9ecef', borderRadius: '8px', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FileText size={14} /> {attachment.name}
                        </span>
                        <button type="button" onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        style={{ flex: 1, padding: '8px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontFamily: 'inherit' }}
                        placeholder="اكتب رسالتك كإدارة للطرفين..."
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                      />
                      <button type="button" onClick={() => fileInputRef.current.click()} style={{
                        background: '#f1f3f5', border: '1px solid #ced4da', borderRadius: '6px',
                        padding: '0 12px', cursor: 'pointer'
                      }}>
                        <Paperclip size={18} />
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*,application/pdf" />
                      <button type="submit" disabled={(!newMessage.trim() && !attachment) || sendingMessage || uploading} style={{
                        background: '#0a58ca',
                        color: 'white',
                        border: 'none',
                        padding: '6px 16px',
                        borderRadius: '6px',
                        cursor: (!newMessage.trim() && !attachment) || sendingMessage ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Send size={14} /> {sendingMessage ? 'جاري...' : 'إرسال'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e9ecef;
          border-top-color: #0a58ca;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 992px) {
          .sidebar {
            position: relative !important;
            width: 100% !important;
            height: auto !important;
            border-left: none !important;
            border-bottom: 1px solid #e9ecef;
            padding: 12px 0 !important;
            margin-bottom: 0 !important;
          }
          .sidebar > div {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
          }
          .sidebar a {
            flex: 1 0 auto;
            justify-content: center;
          }
          div[style*="margin-right: 260px"] {
            margin-right: 0 !important;
          }
          [style*="width: 380px"] {
            width: 100% !important;
          }
        }
        @media (max-width: 768px) {
          [class*="sidebar"] {
            position: relative !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}