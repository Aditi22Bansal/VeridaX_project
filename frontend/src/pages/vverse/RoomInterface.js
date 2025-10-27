import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { vverseService } from '../../services/vverseService';
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  UserGroupIcon,
  EllipsisVerticalIcon,
  PinIcon,
  StarIcon,
  ClockIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const RoomInterface = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected, joinRoom, leaveRoom } = useSocket();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchRoomData();
    fetchMessages();

    // Join room via Socket.IO
    if (connected) {
      joinRoom(roomId);
    }

    // Set up real-time listeners
    if (socket) {
      socket.on('new_message', (data) => {
        if (data.roomId === roomId) {
          setMessages(prev => [...prev, data.message]);
        }
      });

      socket.on('user_typing', (data) => {
        if (data.isTyping) {
          setTypingUsers(prev => [...prev.filter(u => u !== data.userId), data.userId]);
        } else {
          setTypingUsers(prev => prev.filter(u => u !== data.userId));
        }
      });
    }

    return () => {
      if (connected) {
        leaveRoom(roomId);
      }

      if (socket) {
        socket.off('new_message');
        socket.off('user_typing');
      }
    };
  }, [roomId, connected, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchRoomData = async () => {
    try {
      const response = await vverseService.getRoom(roomId);

      if (response.success) {
        setRoom(response.data);
      } else {
        toast.error(response.message || 'Failed to load room');
        navigate('/vverse');
      }
    } catch (error) {
      console.error('Error fetching room:', error);
      toast.error('Failed to load room');
      navigate('/vverse');
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await vverseService.getRoomMessages(roomId);

      if (response.success && Array.isArray(response.data)) {
        setMessages(response.data);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);

      const response = await vverseService.sendMessage(roomId, {
        content: {
          text: newMessage.trim()
        },
        messageType: 'text'
      });

      if (response.success) {
        setNewMessage('');
        fetchMessages(); // Refresh messages
        messageInputRef.current?.focus();
      } else {
        toast.error(response.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Error sending message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getMessageTypeColor = (messageType) => {
    switch (messageType) {
      case 'system':
        return 'bg-gray-100 text-gray-700';
      case 'announcement':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-white text-gray-900';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading room..." />;
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Room not found</h2>
          <p className="text-gray-600 mb-4">The room you're looking for doesn't exist.</p>
          <Link to="/vverse" className="btn-primary">
            Back to VVerse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/vverse')}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{room.name}</h1>
                <p className="text-sm text-gray-600">{room.description}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <UsersIcon className="w-4 h-4 mr-1" />
                <span>{room.memberCount} members</span>
              </div>

              <button
                onClick={() => setShowMembers(!showMembers)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <UserGroupIcon className="w-5 h-5" />
              </button>

              <button className="p-2 text-gray-400 hover:text-gray-600">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {Array.isArray(messages) && messages.map((message, index) => (
                <motion.div
                  key={message._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.senderId?._id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${getMessageTypeColor(message.messageType)}`}>
                    {message.senderId && (
                      <div className="flex items-center mb-1">
                        <img
                          src={message.senderId.avatar || '/default-avatar.png'}
                          alt={message.senderId.name}
                          className="w-6 h-6 rounded-full mr-2"
                        />
                        <span className="text-sm font-medium">
                          {message.senderId.name}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                    )}

                    <div className="text-sm">
                      {message.content.text}
                    </div>

                    {message.isEdited && (
                      <div className="text-xs text-gray-500 mt-1">
                        (edited)
                      </div>
                    )}

                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {message.reactions.map((reaction, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs bg-gray-100 rounded-full"
                          >
                            {reaction.emoji} {reaction.count || 1}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>
                  {typingUsers.length === 1 ? 'Someone is typing...' : `${typingUsers.length} people are typing...`}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <form onSubmit={sendMessage} className="flex items-center space-x-4">
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <PaperClipIcon className="w-5 h-5" />
              </button>

              <div className="flex-1 relative">
                <input
                  ref={messageInputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);

                    // Handle typing indicators
                    if (socket && connected) {
                      socket.emit('typing_start', { roomId });

                      // Clear existing timeout
                      if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                      }

                      // Set new timeout to stop typing
                      typingTimeoutRef.current = setTimeout(() => {
                        socket.emit('typing_stop', { roomId });
                      }, 1000);
                    }
                  }}
                  placeholder="Type a message..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={sendingMessage}
                />
              </div>

              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <FaceSmileIcon className="w-5 h-5" />
              </button>

              <button
                type="submit"
                disabled={!newMessage.trim() || sendingMessage}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Members Sidebar */}
        <AnimatePresence>
          {showMembers && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-white border-l border-gray-200 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Members</h3>
              </div>

              <div className="p-4 space-y-3">
                {room.members
                  .filter(member => member.isActive)
                  .map((member) => (
                    <div key={member.userId._id} className="flex items-center space-x-3">
                      <img
                        src={member.userId.avatar || '/default-avatar.png'}
                        alt={member.userId.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {member.userId.name}
                          </span>
                          {member.role === 'admin' && (
                            <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Joined {formatDate(member.joinedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RoomInterface;
