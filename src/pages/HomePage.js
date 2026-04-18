import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { useAuth } from '../context/AuthContext';
import { getMyGroups, getAllGroups, createGroup, joinGroup, leaveGroup } from '../utils/api';

export default function HomePage() {
  const { token } = useAuth();
  const [myGroups, setMyGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});

  const loadGroups = useCallback(async () => {
    try {
      const [myRes, allRes] = await Promise.all([getMyGroups(), getAllGroups()]);
      const my = myRes.data.data || myRes.data;
      const all = allRes.data.data || allRes.data;
      setMyGroups(Array.isArray(my) ? my : []);
      setAllGroups(Array.isArray(all) ? all : []);
    } catch (e) {}
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const handleCreate = async (form) => {
    try {
      await createGroup(form);
      await loadGroups();
    } catch (e) {}
  };

  const handleJoin = async (groupId) => {
    try {
      await joinGroup(groupId);
      await loadGroups();
    } catch (e) {}
  };

  const handleLeave = async (groupId) => {
    try {
      await leaveGroup(groupId);
      if (activeGroup?._id === groupId) setActiveGroup(null);
      await loadGroups();
    } catch (e) {}
  };

  const handleSelectGroup = (group) => {
    // Refresh group data from myGroups to get populated members
    const fresh = myGroups.find(g => g._id === group._id) || group;
    setActiveGroup(fresh);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        myGroups={myGroups}
        allGroups={allGroups}
        activeGroup={activeGroup}
        onSelectGroup={handleSelectGroup}
        onJoinGroup={handleJoin}
        onLeaveGroup={handleLeave}
        onCreateGroup={handleCreate}
        onlineUsers={onlineUsers}
      />
      <ChatWindow
        group={activeGroup}
        onLeaveGroup={handleLeave}
      />
    </div>
  );
}
