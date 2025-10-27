const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken: auth } = require('../middleware/auth');
const ProjectRoom = require('../models/ProjectRoom');
const RoomMessage = require('../models/RoomMessage');
const Notification = require('../models/Notification');
const Campaign = require('../models/Campaign');
const User = require('../models/User');

// @route   GET /api/vverse/rooms
// @desc    Get user's project rooms
// @access  Private
router.get('/rooms', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'active' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find rooms where user is a member
    const rooms = await ProjectRoom.find({
      'members.userId': req.user.id,
      'members.isActive': true,
      status
    })
      .populate('campaignId', 'title description imageURL')
      .populate('createdBy', 'name avatar')
      .populate('members.userId', 'name avatar')
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ProjectRoom.countDocuments({
      'members.userId': req.user.id,
      'members.isActive': true,
      status
    });

    res.json({
      success: true,
      data: rooms,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRooms: total,
        hasNext: skip + rooms.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching rooms'
    });
  }
});

// @route   GET /api/vverse/rooms/recommended
// @desc    Get recommended rooms based on skills
// @access  Private
router.get('/rooms/recommended', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get user's skills (assuming they're stored in user profile)
    const user = await User.findById(req.user.id).select('skills');
    const userSkills = user.skills || [];

    // Find rooms that match user's skills
    const recommendedRooms = await ProjectRoom.find({
      'members.userId': { $ne: req.user.id }, // Not already a member
      status: 'active',
      'settings.isPublic': true,
      $or: [
        { skills: { $in: userSkills } },
        { 'requirements.requiredSkills': { $in: userSkills } }
      ]
    })
      .populate('campaignId', 'title description imageURL')
      .populate('createdBy', 'name avatar')
      .sort({ lastActivity: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: recommendedRooms
    });
  } catch (error) {
    console.error('Get recommended rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recommended rooms'
    });
  }
});

// @route   POST /api/vverse/rooms
// @desc    Create a new project room
// @access  Private
router.post('/rooms', [
  auth,
  body('campaignId', 'Campaign ID is required').notEmpty(),
  body('name', 'Room name is required').notEmpty().trim(),
  body('description', 'Description cannot be more than 500 characters').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      campaignId,
      name,
      description,
      skills,
      requirements,
      settings
    } = req.body;

    // Check if campaign exists and user has permission
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if user is campaign creator or admin
    if (campaign.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create room for this campaign. Only campaign creators or admins can create rooms.'
      });
    }

    // Check if room already exists for this campaign
    const existingRoom = await ProjectRoom.findOne({ campaignId });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: 'Room already exists for this campaign'
      });
    }

    // Create room
    const room = new ProjectRoom({
      campaignId,
      name,
      description,
      createdBy: req.user.id,
      skills: skills || [],
      requirements: requirements || {},
      settings: settings || {},
      members: [{
        userId: req.user.id,
        role: 'admin',
        joinedAt: new Date(),
        isActive: true
      }]
    });

    await room.save();

    // Create system message
    await RoomMessage.createSystemMessage(
      room._id,
      `Welcome to ${room.name}! This room was created for the campaign.`
    );

    // Populate and return
    await room.populate([
      { path: 'campaignId', select: 'title description imageURL' },
      { path: 'createdBy', select: 'name avatar' },
      { path: 'members.userId', select: 'name avatar' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating room'
    });
  }
});

// @route   GET /api/vverse/rooms/:id
// @desc    Get room details (create if doesn't exist)
// @access  Private
router.get('/rooms/:id', auth, async (req, res) => {
  try {
    let room = await ProjectRoom.findById(req.params.id)
      .populate('campaignId', 'title description imageURL')
      .populate('createdBy', 'name avatar')
      .populate('members.userId', 'name avatar');

    // If room doesn't exist, create a new one
    if (!room) {
      console.log('Room not found, creating new room for campaign:', req.params.id);
      
      // Get campaign details
      const campaign = await Campaign.findById(req.params.id);
      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      // Create new room
      room = new ProjectRoom({
        _id: req.params.id, // Use campaign ID as room ID
        campaignId: req.params.id,
        name: `${campaign.title} Discussion`,
        description: `Join the discussion for ${campaign.title}. Share ideas, coordinate activities, and collaborate with other volunteers.`,
        createdBy: req.user.id,
        skills: [campaign.category || 'general'],
        requirements: {
          minVolunteers: 1,
          maxVolunteers: 100,
          requiredSkills: [],
          experienceLevel: 'beginner'
        },
        settings: {
          isPublic: true,
          allowMemberInvites: true,
          requireApproval: false,
          allowFileSharing: true
        },
        members: [{
          userId: req.user.id,
          role: 'admin',
          joinedAt: new Date(),
          isActive: true
        }]
      });

      await room.save();
      
      // Populate the new room
      room = await ProjectRoom.findById(req.params.id)
        .populate('campaignId', 'title description imageURL')
        .populate('createdBy', 'name avatar')
        .populate('members.userId', 'name avatar');
    }

    // Add user to room if not already a member
    const isMember = room.members.some(member =>
      member.userId._id.toString() === req.user.id && member.isActive
    );

    if (!isMember) {
      room.members.push({
        userId: req.user.id,
        role: 'member',
        joinedAt: new Date(),
        isActive: true
      });
      await room.save();
    }

    res.json({
      success: true,
      data: {
        ...room.toObject(),
        isMember: true,
        canJoin: true
      }
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching room'
    });
  }
});

// @route   POST /api/vverse/rooms/:id/join
// @desc    Join a room
// @access  Private
router.post('/rooms/:id/join', auth, async (req, res) => {
  try {
    const room = await ProjectRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is already a member
    const isAlreadyMember = room.members.some(member =>
      member.userId.toString() === req.user.id && member.isActive
    );

    if (!isAlreadyMember) {
      // Add user to room
      room.members.push({
        userId: req.user.id,
        role: 'member',
        joinedAt: new Date(),
        isActive: true
      });
      await room.save();
    }

    // Create system message
    await RoomMessage.createSystemMessage(
      room._id,
      `${req.user.name} joined the room`
    );

    // Update room activity
    await room.updateActivity();

    res.json({
      success: true,
      message: 'Successfully joined room'
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while joining room'
    });
  }
});

// @route   POST /api/vverse/rooms/:id/leave
// @desc    Leave a room
// @access  Private
router.post('/rooms/:id/leave', auth, async (req, res) => {
  try {
    const room = await ProjectRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is a member
    const isMember = room.members.some(member =>
      member.userId.toString() === req.user.id && member.isActive
    );

    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this room'
      });
    }

    // Check if user is the creator
    if (room.createdBy.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Room creator cannot leave the room'
      });
    }

    // Remove user from room
    await room.removeMember(req.user.id);

    // Create system message
    await RoomMessage.createSystemMessage(
      room._id,
      `${req.user.name} left the room`
    );

    // Update room activity
    await room.updateActivity();

    res.json({
      success: true,
      message: 'Successfully left room'
    });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while leaving room'
    });
  }
});

// @route   GET /api/vverse/rooms/:id/messages
// @desc    Get room messages
// @access  Private
router.get('/rooms/:id/messages', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, before } = req.query;

    const room = await ProjectRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is a member
    const isMember = room.members.some(member =>
      member.userId.toString() === req.user.id && member.isActive
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view messages'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { roomId: req.params.id, isDeleted: false };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await RoomMessage.find(query)
      .populate('senderId', 'name avatar')
      .populate('replyTo', 'content.text senderId')
      .populate('mentions', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await RoomMessage.countDocuments(query);

    res.json({
      success: true,
      data: messages.reverse(), // Return in chronological order
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalMessages: total,
        hasNext: skip + messages.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching messages'
    });
  }
});

// @route   POST /api/vverse/rooms/:id/messages
// @desc    Send message to room
// @access  Private
router.post('/rooms/:id/messages', [
  auth,
  body('content.text', 'Message content is required').notEmpty().trim(),
  body('messageType', 'Valid message type is required').optional().isIn(['text', 'file', 'image'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const room = await ProjectRoom.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is a member
    const isMember = room.members.some(member =>
      member.userId.toString() === req.user.id && member.isActive
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages'
      });
    }

    const {
      content,
      messageType = 'text',
      replyTo,
      mentions = []
    } = req.body;

    // Create message
    const message = new RoomMessage({
      roomId: req.params.id,
      senderId: req.user.id,
      messageType,
      content,
      replyTo,
      mentions
    });

    await message.save();

    // Update room statistics and activity
    room.statistics.totalMessages += 1;
    await room.updateActivity();

    // Send real-time notifications via Socket.IO
    const io = req.app.get('io');

    // Send notifications to mentioned users
    if (mentions.length > 0) {
      for (const mentionId of mentions) {
        if (mentionId.toString() !== req.user.id.toString()) {
          await Notification.createRoomMention(
            mentionId,
            req.params.id,
            message._id,
            req.user.id
          );

          // Send real-time notification
          io.to(`user_${mentionId}`).emit('notification', {
            type: 'room_mention',
            title: 'You were mentioned',
            message: `${req.user.name} mentioned you in ${room.name}`,
            roomId: req.params.id,
            messageId: message._id
          });
        }
      }
    }

    // Send notifications to other room members (except sender)
    const otherMembers = room.members.filter(member =>
      member.userId.toString() !== req.user.id && member.isActive
    );

    for (const member of otherMembers) {
      await Notification.createRoomMessage(
        member.userId,
        req.params.id,
        message._id,
        req.user.id
      );

      // Send real-time notification
      io.to(`user_${member.userId}`).emit('notification', {
        type: 'room_message',
        title: 'New Message',
        message: `${req.user.name} sent a message in ${room.name}`,
        roomId: req.params.id,
        messageId: message._id
      });
    }

    // Broadcast message to room members
    io.to(`room_${req.params.id}`).emit('new_message', {
      message: message,
      roomId: req.params.id
    });

    // Populate and return
    await message.populate([
      { path: 'senderId', select: 'name avatar' },
      { path: 'replyTo', select: 'content.text senderId' },
      { path: 'mentions', select: 'name avatar' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending message'
    });
  }
});

// @route   GET /api/vverse/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, isRead } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.getUserNotifications(req.user.id, {
      limit: parseInt(limit),
      skip,
      type,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined
    });

    const total = await Notification.countDocuments({
      userId: req.user.id,
      isArchived: false
    });

    const unreadCount = await Notification.getUnreadCount(req.user.id);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalNotifications: total,
        hasNext: skip + notifications.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications'
    });
  }
});

// @route   PUT /api/vverse/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/notifications/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this notification'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating notification'
    });
  }
});

// @route   PUT /api/vverse/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/notifications/read-all', auth, async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating notifications'
    });
  }
});

module.exports = router;
