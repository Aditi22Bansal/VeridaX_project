import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect to Socket.IO server
      const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('Connected to VVerse Socket.IO server');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from VVerse Socket.IO server');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        setConnected(false);
      });

      // Notification events
      newSocket.on('notification', (notification) => {
        console.log('Received notification:', notification);
        setNotifications(prev => [notification, ...prev]);

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico'
          });
        }
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
      };
    } else {
      // Disconnect if user is not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const joinRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('join_room', roomId);
    }
  };

  const leaveRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('leave_room', roomId);
    }
  };

  const sendMessage = (roomId, message) => {
    if (socket && connected) {
      socket.emit('new_message', { roomId, message });
    }
  };

  const startTyping = (roomId) => {
    if (socket && connected) {
      socket.emit('typing_start', { roomId });
    }
  };

  const stopTyping = (roomId) => {
    if (socket && connected) {
      socket.emit('typing_stop', { roomId });
    }
  };

  const value = {
    socket,
    connected,
    notifications,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
