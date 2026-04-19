import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Avatar({ name, size = 36, online }) {
  const colors = ['#2563eb', '#0ea5e9', '#0284c7', '#1d4ed8', '#3b82f6'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.35, fontWeight: 700, color: '#fff',
      }}>{initials}</div>
      {online !== undefined && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: size * 0.3, height: size * 0.3, borderRadius: '50%',
          background: online ? '#22c55e' : '#94a3b8',
          border: '2px solid #fff',
        }} />
      )}
    </div>
  );
}

export default function Sidebar({ myGroups, allGroups, activeGroup, onSelectGroup, onJoinGroup, onLeaveGroup, onCreateGroup, onlineUsers }) {
  const { user, logoutUser } = useAuth();
  const [tab, setTab] = useState('my');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [search, setSearch] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    onCreateGroup(createForm);
    setCreateForm({ name: '', description: '' });
    setShowCreate(false);
  };

  const filteredAll = allGroups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
  const isMember = (group) => myGroups.some(g => g._id === group._id);

  return (
    <div style={s.sidebar}>
      <div style={s.header}>
        <div style={s.logoRow}>
          <div style={s.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="#2563eb"/>
              <path d="M7 9h14M7 14h10M7 19h6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={s.brand}>ChatSphere</span>
        </div>
        <div style={s.userRow}>
          <Avatar name={user?.name || user?.email} size={32} online={true} />
          <div style={s.userInfo}>
            <div style={s.userName}>{user?.firstName || 'You'}</div>
            <div style={s.userEmail}>{user?.email}</div>
          </div>
          <button onClick={logoutUser} style={s.logoutBtn} title="Logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      </div>

      <div style={s.tabRow}>
        <button style={tab === 'my' ? s.tabActive : s.tab} onClick={() => setTab('my')}>My Groups</button>
        <button style={tab === 'all' ? s.tabActive : s.tab} onClick={() => setTab('all')}>Discover</button>
      </div>

      {tab === 'all' && (
        <div style={s.searchWrap}>
          <svg style={s.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            style={s.searchInput}
            placeholder="Search groups..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {tab === 'my' && (
        <button onClick={() => setShowCreate(!showCreate)} style={s.createBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Group
        </button>
      )}

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} style={s.createForm}>
          <input
            style={s.createInput}
            placeholder="Group name"
            value={createForm.name}
            onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
            required
          />
          <input
            style={s.createInput}
            placeholder="Description (optional)"
            value={createForm.description}
            onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" style={s.createSubmit}>Create</button>
            <button type="button" onClick={() => setShowCreate(false)} style={s.createCancel}>Cancel</button>
          </div>
        </form>
      )}

   
      <div style={s.list}>
        {tab === 'my' && (
          myGroups.length === 0
            ? <div style={s.empty}>No groups yet. Create one!</div>
            : myGroups.map(group => {
                const onlineCount = onlineUsers[group._id]?.length || 0;
                return (
                  <div
                    key={group._id}
                    style={activeGroup?._id === group._id ? s.groupItemActive : s.groupItem}
                    onClick={() => onSelectGroup(group)}
                  >
                    <div style={s.groupAvatar}>
                      <span style={s.groupAvatarText}>{group.name[0].toUpperCase()}</span>
                    </div>
                    <div style={s.groupInfo}>
                      <div style={s.groupName}>{group.name}</div>
                      <div style={s.groupMeta}>
                        {group.members?.length || 0} members
                        {onlineCount > 0 && <span style={s.onlineDot}>{onlineCount} online</span>}
                      </div>
                    </div>
                  </div>
                );
              })
        )}

        {tab === 'all' && (
          filteredAll.length === 0
            ? <div style={s.empty}>No groups found</div>
            : filteredAll.map(group => (
                <div key={group._id} style={s.discoverItem}>
                  <div style={s.groupAvatar}>
                    <span style={s.groupAvatarText}>{group.name[0].toUpperCase()}</span>
                  </div>
                  <div style={s.groupInfo}>
                    <div style={s.groupName}>{group.name}</div>
                    <text style={s.groupId}>{group._id}</text>
                    <div style={s.groupMeta}>{group.members?.length || 0} members</div>
                  </div>
                  {isMember(group) ? (
                    <button onClick={() => onLeaveGroup(group._id)} style={s.leaveBtn}>Leave</button>
                  ) : (
                    <button onClick={() => onJoinGroup(group._id)} style={s.joinBtn}>Join</button>
                  )}
                </div>
              ))
        )}
      </div>
    </div>
  );
}

const s = {
  sidebar: {
    width: 280, minWidth: 280, height: '100vh',
    background: '#fff', borderRight: '1px solid #e2e8f0',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  header: {
    padding: '20px 16px 14px',
    borderBottom: '1px solid #f1f5f9',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  logoIcon: {
    width: 32, height: 32, borderRadius: 9, background: '#eff6ff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  brand: { fontSize: 17, fontWeight: 700, color: '#1e3a8a', letterSpacing: '-0.3px' },
  userRow: { display: 'flex', alignItems: 'center', gap: 10 },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userEmail: { fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  logoutBtn: {
    background: 'none', border: 'none', cursor: 'pointer', padding: 6,
    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  tabRow: {
    display: 'flex', padding: '12px 14px 0', gap: 4,
  },
  tab: {
    flex: 1, padding: '8px 10px', border: 'none', background: 'transparent',
    borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 500,
    color: '#64748b', fontFamily: 'var(--font)', transition: 'all 0.2s',
  },
  tabActive: {
    flex: 1, padding: '8px 10px', border: 'none', background: '#eff6ff',
    borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
    color: '#2563eb', fontFamily: 'var(--font)',
  },
  searchWrap: {
    margin: '10px 14px 0', position: 'relative',
  },
  searchIcon: {
    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
  },
  searchInput: {
    width: '100%', padding: '9px 10px 9px 30px', border: '1.5px solid #e2e8f0',
    borderRadius: 9, fontSize: 13, background: '#f8fafc', outline: 'none',
    fontFamily: 'var(--font)', color: '#334155',
  },
  createBtn: {
    margin: '12px 14px 0', padding: '9px 14px',
    background: '#2563eb', color: '#fff', border: 'none',
    borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600,
    fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: 7,
    width: 'calc(100% - 28px)',
  },
  createForm: {
    margin: '10px 14px 0', display: 'flex', flexDirection: 'column', gap: 8,
    padding: '14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0',
  },
  createInput: {
    padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8,
    fontSize: 13, background: '#fff', outline: 'none', fontFamily: 'var(--font)',
  },
  createSubmit: {
    flex: 1, padding: '8px', background: '#2563eb', color: '#fff',
    border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13,
    fontWeight: 600, fontFamily: 'var(--font)',
  },
  createCancel: {
    flex: 1, padding: '8px', background: '#f1f5f9', color: '#64748b',
    border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13,
    fontWeight: 500, fontFamily: 'var(--font)',
  },
  list: { flex: 1, overflowY: 'auto', padding: '8px 0 16px' },
  empty: { padding: '24px 16px', textAlign: 'center', fontSize: 13, color: '#94a3b8' },
  groupItem: {
    display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px',
    cursor: 'pointer', transition: 'background 0.15s', borderRadius: 0,
  },
  groupItemActive: {
    display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px',
    cursor: 'pointer', background: '#eff6ff', borderLeft: '3px solid #2563eb',
  },
  discoverItem: {
    display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px',
  },
  groupAvatar: {
    width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #2563eb, #60a5fa)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  groupAvatarText: { fontSize: 16, fontWeight: 700, color: '#fff' },
  groupInfo: { flex: 1, minWidth: 0 },
  groupName: { fontSize: 14, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  groupMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 },
  onlineDot: {
    background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 600,
    padding: '1px 7px', borderRadius: 99,
  },
  joinBtn: {
    padding: '6px 14px', background: '#2563eb', color: '#fff', border: 'none',
    borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600,
    fontFamily: 'var(--font)', flexShrink: 0,
  },
  leaveBtn: {
    padding: '6px 14px', background: '#f1f5f9', color: '#64748b', border: 'none',
    borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 500,
    fontFamily: 'var(--font)', flexShrink: 0,
  },
  groupId: {
  fontSize: 10,
  color: '#94a3b8',
  userSelect: 'text',
  WebkitUserSelect: 'text',
  cursor: 'pointer',
  fontFamily: 'monospace',
  letterSpacing: '0.3px',
},
};
