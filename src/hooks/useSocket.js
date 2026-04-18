import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const useSocket = (token) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => setConnected(true));
    socketRef.current.on('disconnect', () => setConnected(false));

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token]);

  const joinGroup = useCallback((groupId) => {
    socketRef.current?.emit('joinGroup', groupId);
  }, []);

  const sendMessage = useCallback((groupId, content) => {
    socketRef.current?.emit('sendMessage', { groupId, content });
  }, []);

  const sendTyping = useCallback((groupId, isTyping) => {
    socketRef.current?.emit('typing', { groupId, isTyping });
  }, []);

  const getOnlineUsers = useCallback((groupId) => {
    socketRef.current?.emit('getOnlineUsers', groupId);
  }, []);

  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  return { socket: socketRef.current, connected, joinGroup, sendMessage, sendTyping, getOnlineUsers, on };
};
