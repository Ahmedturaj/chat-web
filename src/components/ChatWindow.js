import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { getGroupMessages } from '../utils/api';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

function Avatar({ name, size = 32 }) {
  const colors = ['#2563eb', '#0ea5e9', '#0284c7', '#1d4ed8', '#7c3aed'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>{initials}</div>
  );
}

function formatMsgTime(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'hh:mm a');
  if (isYesterday(d)) return `Yesterday ${format(d, 'hh:mm a')}`;
  return format(d, 'MMM d, hh:mm a');
}

function DateDivider({ date }) {
  const d = new Date(date);
  let label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d, yyyy');
  return (
    <div style={s.dateDivider}>
      <div style={s.dateLine} />
      <span style={s.dateLabel}>{label}</span>
      <div style={s.dateLine} />
    </div>
  );
}

export default function ChatWindow({ group, onLeaveGroup }) {
  const { user, token } = useAuth();
  const { socket, connected, joinGroup, sendMessage, sendTyping, getOnlineUsers, on } = useSocket(token);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [readReceipts, setReadReceipts] = useState({});
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Load messages and join socket room
  useEffect(() => {
    if (!group?._id) return;
    setMessages([]);
    setTypingUsers([]);
    setOnlineUsers([]);

    // Load previous messages via REST
    getGroupMessages(group._id)
      .then(res => {
        const msgs = res.data.data || res.data;
        setMessages(Array.isArray(msgs) ? msgs : []);
      })
      .catch(() => { });

    // Join socket room
    if (connected) {
      joinGroup(group._id);
      getOnlineUsers(group._id);
    }
  }, [group?._id, connected]);

  // Socket event listeners
  useEffect(() => {
    if (!group?._id) return;

    const cleanups = [
      on('previousMessages', (msgs) => {
        setMessages(Array.isArray(msgs) ? msgs : []);
      }),
      on('receiveMessage', (msg) => {
        setMessages(prev => [...prev, msg]);
        // Mark as read if message is not from us
        if (msg.sender?._id !== user?._id) {
          setReadReceipts(prev => ({ ...prev, [msg._id]: true }));
        }
      }),
      on('userTyping', ({ userId, name, isTyping }) => {
        if (userId === user?._id) return;
        setTypingUsers(prev =>
          isTyping
            ? prev.includes(name) ? prev : [...prev, name]
            : prev.filter(n => n !== name)
        );
      }),
      on('onlineUsers', (users) => {
        setOnlineUsers(Array.isArray(users) ? users : []);
      }),
      on('userJoined', () => {
        getOnlineUsers(group._id);
      }),
    ];

    return () => cleanups.forEach(fn => typeof fn === 'function' && fn());
  }, [group?._id, on, user?._id, getOnlineUsers]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim() || !group?._id) return;
    sendMessage(group._id, input.trim());
    setInput('');
    sendTyping(group._id, false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    sendTyping(group._id, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTyping(group._id, false), 2000);
  };

  // Group messages by date for dividers
  const groupedMessages = messages.reduce((acc, msg) => {
    const day = format(new Date(msg.createdAt), 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = [];
    acc[day].push(msg);
    return acc;
  }, {});

  const isMe = (msg) => {
    const senderId = msg.sender?._id || msg.sender;
    return senderId === user?._id || senderId === user?.id;
  };

  // Check if msg is last in sequence from same sender
  const isLastInGroup = (msgs, index) => {
    if (index === msgs.length - 1) return true;
    const curr = msgs[index].sender?._id || msgs[index].sender;
    const next = msgs[index + 1].sender?._id || msgs[index + 1].sender;
    return curr !== next;
  };

  if (!group) {
    return (
      <div style={s.empty}>
        <div style={s.emptyInner}>
          <div style={s.emptyIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="1.5">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <div style={s.emptyTitle}>Select a group to start chatting</div>
          <div style={s.emptySub}>Join or create a group from the sidebar</div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.window}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.groupIconBig}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{group.name[0].toUpperCase()}</span>
          </div>
          <div>
            <div style={s.groupName}>{group.name}</div>
            <div style={s.groupStats}>
              <span>{group.members?.length || 0} members</span>
              {onlineUsers.length > 0 && (
                <span style={s.onlineTag}>{onlineUsers.length} online</span>
              )}
              {!connected && <span style={s.offlineTag}>Reconnecting...</span>}
            </div>
          </div>
        </div>
        <div style={s.headerActions}>
          <button style={s.iconBtn} onClick={() => { setShowMembers(!showMembers); if (!showMembers) getOnlineUsers(group._id); }} title="Members">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={showMembers ? '#2563eb' : '#64748b'} strokeWidth="2" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          </button>
          <button style={s.leaveBtn} onClick={() => onLeaveGroup(group._id)}>
            Leave Group
          </button>
        </div>
      </div>

      <div style={s.body}>
        {/* Messages */}
        <div style={s.messages}>
          {Object.entries(groupedMessages).map(([day, msgs]) => (
            <div key={day}>
              <DateDivider date={day} />
              {msgs.map((msg, i) => {
                const me = isMe(msg);
                const getName = (user) =>
                  `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
                const senderName = getName(msg.sender) || user?.firstName;
                const showAvatar = !me && isLastInGroup(msgs, i);
                const showName = !me && (i === 0 || (msgs[i - 1].sender?._id || msgs[i - 1].sender) !== (msg.sender?._id || msg.sender));

                return (
                  <div
                    key={msg._id}
                    style={{ ...s.msgRow, justifyContent: me ? 'flex-end' : 'flex-start', animation: 'msgIn 0.2s ease' }}
                  >
                    {!me && (
                      <div style={{ width: 32, flexShrink: 0, alignSelf: 'flex-end', marginBottom: 4 }}>
                        {showAvatar && <Avatar name={senderName} size={30} />}
                      </div>
                    )}
                    <div style={{ maxWidth: '65%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: me ? 'flex-end' : 'flex-start' }}>
                      {showName && <div style={s.senderName}>{senderName}</div>}
                      <div style={me ? s.bubbleMe : s.bubbleOther}>
                        <span style={s.msgContent}>{msg.content}</span>
                      </div>
                      <div style={s.msgTime}>
                        {formatMsgTime(msg.createdAt)}
                        {me && (
                          <span style={s.readReceipt} title={readReceipts[msg._id] ? 'Read' : 'Sent'}>
                            {readReceipts[msg._id] ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div style={{ ...s.msgRow, justifyContent: 'flex-start', animation: 'fadeIn 0.2s ease' }}>
              <div style={{ width: 32 }} />
              <div style={s.typingBubble}>
                <div style={s.typingDots}>
                  <div style={{ ...s.dot, animationDelay: '0ms' }} />
                  <div style={{ ...s.dot, animationDelay: '160ms' }} />
                  <div style={{ ...s.dot, animationDelay: '320ms' }} />
                </div>
                <span style={s.typingText}>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Members panel */}
        {showMembers && (
          <div style={s.membersPanel}>
            <div style={s.membersPanelHeader}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Members</span>
              <button onClick={() => setShowMembers(false)} style={s.closeBtn}>✕</button>
            </div>
            <div style={s.membersList}>
              {group.members?.map(m => {
                const memberId = m._id || m;
                const memberName = m.firstName || m.email || memberId;
                const isOnline = onlineUsers.some(u => u.userId === memberId);
                return (
                  <div key={memberId} style={s.memberItem}>
                    <div style={{ position: 'relative' }}>
                      <Avatar name={memberName} size={32} />
                      <div style={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: 10, height: 10, borderRadius: '50%',
                        background: isOnline ? '#22c55e' : '#94a3b8',
                        border: '2px solid #fff',
                      }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                        {memberName}
                        {(memberId === user?._id || memberId === user?.id) && <span style={s.youTag}> you</span>}
                      </div>
                      <div style={{ fontSize: 11, color: isOnline ? '#16a34a' : '#94a3b8' }}>{isOnline ? 'Online' : 'Offline'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={s.inputArea}>
        <div style={s.inputRow}>
          <textarea
            ref={inputRef}
            style={s.textarea}
            placeholder={`Message ${group.name}...`}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <div style={s.emojiWrapper}>
            <button
              style={s.emojiBtn}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              onClick={() => setInput(input + '😊')}
            >
              😊
            </button>

            <button
              style={s.emojiBtn}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              onClick={() => setInput(input + '👍')}
            >
              👍
            </button>

            <button
              style={s.emojiBtn}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              onClick={() => setInput(input + '❤️')}
            >
              ❤️
            </button>
          </div>
          <button
            style={input.trim() ? s.sendBtn : s.sendBtnDisabled}
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <div style={s.inputHint}>Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  );
}

const s = {
  window: { flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8fafc', overflow: 'hidden' },
  empty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' },
  emptyInner: { textAlign: 'center' },
  emptyIcon: {
    width: 80, height: 80, background: '#eff6ff', borderRadius: 24,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(37,99,235,0.1)',
  },
  emptyTitle: { fontSize: 17, fontWeight: 600, color: '#334155', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#94a3b8' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px', background: '#fff', borderBottom: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  groupIconBig: {
    width: 42, height: 42, borderRadius: 13,
    background: 'linear-gradient(135deg, #2563eb, #60a5fa)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  groupName: { fontSize: 16, fontWeight: 700, color: '#1e293b' },
  groupStats: { fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 },
  onlineTag: { background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 99 },
  offlineTag: { background: '#fef3c7', color: '#d97706', fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 99 },
  headerActions: { display: 'flex', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 36, height: 36, border: '1.5px solid #e2e8f0', borderRadius: 9,
    background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  leaveBtn: {
    padding: '7px 14px', background: '#fff', color: '#ef4444',
    border: '1.5px solid #fecaca', borderRadius: 9, cursor: 'pointer',
    fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)',
  },
  body: { flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' },
  messages: { flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6 },
  dateDivider: { display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 12px' },
  dateLine: { flex: 1, height: 1, background: '#e2e8f0' },
  dateLabel: { fontSize: 11.5, fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap' },
  msgRow: { display: 'flex', gap: 8, alignItems: 'flex-end' },
  senderName: { fontSize: 11.5, fontWeight: 600, color: '#64748b', paddingLeft: 2 },
  bubbleMe: {
    background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff',
    padding: '10px 14px', borderRadius: '18px 18px 4px 18px',
    boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
    maxWidth: '100%', wordBreak: 'break-word',
  },
  bubbleOther: {
    background: '#fff', color: '#1e293b',
    padding: '10px 14px', borderRadius: '18px 18px 18px 4px',
    border: '1.5px solid #e2e8f0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    maxWidth: '100%', wordBreak: 'break-word',
  },
  msgContent: { fontSize: 14, lineHeight: 1.5 },
  msgTime: { fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 2 },
  readReceipt: { fontSize: 12, color: '#60a5fa' },
  typingBubble: {
    background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '18px 18px 18px 4px',
    padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  typingDots: { display: 'flex', gap: 4, alignItems: 'center' },
  dot: {
    width: 7, height: 7, borderRadius: '50%', background: '#93c5fd',
    animation: 'bounce 1.2s ease infinite',
  },
  typingText: { fontSize: 12, color: '#94a3b8' },
  membersPanel: {
    width: 240, background: '#fff', borderLeft: '1px solid #e2e8f0',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  membersPanelHeader: {
    padding: '16px', borderBottom: '1px solid #f1f5f9',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 14, color: '#94a3b8', padding: 4,
  },
  membersList: { flex: 1, overflowY: 'auto', padding: '8px 0' },
  memberItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px' },
  youTag: { fontSize: 10, background: '#dbeafe', color: '#2563eb', borderRadius: 4, padding: '1px 5px', fontWeight: 600 },
  inputArea: { padding: '12px 20px 16px', background: '#fff', borderTop: '1px solid #e2e8f0' },
  inputRow: { display: 'flex', gap: 10, alignItems: 'flex-end' },
  textarea: {
    flex: 1, padding: '11px 16px', border: '1.5px solid #e2e8f0', borderRadius: 12,
    fontSize: 14, color: '#1e293b', resize: 'none', outline: 'none',
    fontFamily: 'var(--font)', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto',
    background: '#f8fafc', transition: 'border-color 0.2s',
  },
  sendBtn: {
    width: 44, height: 44, background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    border: 'none', borderRadius: 12, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
  },
  sendBtnDisabled: {
    width: 44, height: 44, background: '#dbeafe',
    border: 'none', borderRadius: 12, cursor: 'not-allowed',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  inputHint: { fontSize: 11, color: '#cbd5e1', marginTop: 6, textAlign: 'center' },
  emojiWrapper: {
    display: 'flex',
    gap: 8,
    marginTop: 6,
  },

  emojiBtn: {
    background: 'transparent',
    border: 'none',
    padding: 0,
    fontSize: 18,
    cursor: 'pointer',
    lineHeight: 1,
    transition: 'transform 0.15s ease',
  },

  emojiBtnHover: {
    transform: 'scale(1.2)',
  },
};
