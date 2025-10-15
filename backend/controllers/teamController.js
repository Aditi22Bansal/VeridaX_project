const Team = require('../models/Team');
const Project = require('../models/Project');
const User = require('../models/User');

const teamController = {
    // Get team by project ID
    async getTeamByProject(req, res) {
        try {
            const projectId = req.params.projectId;

            const team = await Team.findOne({ project: projectId })
                .populate('leader', 'name email')
                .populate('members.user', 'name email skills')
                .populate('project', 'title description');

            if (!team) {
                return res.status(404).json({ message: 'Team not found' });
            }

            res.json(team);
        } catch (error) {
            console.error('Error fetching team:', error);
            res.status(500).json({ message: 'Failed to fetch team' });
        }
    },

    // Update team settings
    async updateTeamSettings(req, res) {
        try {
            const projectId = req.params.projectId;
            const updates = req.body;

            const team = await Team.findOne({ project: projectId });

            if (!team) {
                return res.status(404).json({ message: 'Team not found' });
            }

            // Check if user is the team leader or has admin permissions
            const isLeader = team.leader.toString() === req.user._id.toString();
            const isAdmin = team.members.find(member =>
                member.user.toString() === req.user._id.toString() &&
                member.permissions.includes('admin')
            );

            if (!isLeader && !isAdmin) {
                return res.status(403).json({ message: 'Not authorized to update team settings' });
            }

            const updatedTeam = await Team.findByIdAndUpdate(
                team._id,
                updates,
                { new: true, runValidators: true }
            ).populate('leader', 'name email')
             .populate('members.user', 'name email');

            res.json({
                message: 'Team settings updated successfully',
                team: updatedTeam
            });
        } catch (error) {
            console.error('Error updating team settings:', error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    message: 'Validation error',
                    errors: Object.keys(error.errors).reduce((acc, key) => {
                        acc[key] = error.errors[key].message;
                        return acc;
                    }, {})
                });
            }
            res.status(500).json({ message: 'Failed to update team settings' });
        }
    },

    // Add team member
    async addTeamMember(req, res) {
        try {
            const { userId, role, permissions } = req.body;
            const projectId = req.params.projectId;

            const team = await Team.findOne({ project: projectId });

            if (!team) {
                return res.status(404).json({ message: 'Team not found' });
            }

            // Check if user has admin permissions
            const isAdmin = team.members.find(member =>
                member.user.toString() === req.user._id.toString() &&
                member.permissions.includes('admin')
            );

            if (!isAdmin) {
                return res.status(403).json({ message: 'Not authorized to add team members' });
            }

            await team.addMember(userId, role, permissions);

            res.json({ message: 'Team member added successfully' });
        } catch (error) {
            console.error('Error adding team member:', error);
            if (error.message === 'User is already a team member') {
                return res.status(400).json({ message: error.message });
            }
            if (error.message === 'Team has reached maximum member limit') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Failed to add team member' });
        }
    },

    // Remove team member
    async removeTeamMember(req, res) {
        try {
            const { userId } = req.params;
            const projectId = req.params.projectId;

            const team = await Team.findOne({ project: projectId });

            if (!team) {
                return res.status(404).json({ message: 'Team not found' });
            }

            // Check if user has admin permissions
            const isAdmin = team.members.find(member =>
                member.user.toString() === req.user._id.toString() &&
                member.permissions.includes('admin')
            );

            if (!isAdmin) {
                return res.status(403).json({ message: 'Not authorized to remove team members' });
            }

            await team.removeMember(userId);

            res.json({ message: 'Team member removed successfully' });
        } catch (error) {
            console.error('Error removing team member:', error);
            res.status(500).json({ message: 'Failed to remove team member' });
        }
    },

    // Update member role
    async updateMemberRole(req, res) {
        try {
            const { userId } = req.params;
            const { role, permissions } = req.body;
            const projectId = req.params.projectId;

            const team = await Team.findOne({ project: projectId });

            if (!team) {
                return res.status(404).json({ message: 'Team not found' });
            }

            // Check if user has admin permissions
            const isAdmin = team.members.find(member =>
                member.user.toString() === req.user._id.toString() &&
                member.permissions.includes('admin')
            );

            if (!isAdmin) {
                return res.status(403).json({ message: 'Not authorized to update member roles' });
            }

            await team.updateMemberRole(userId, role, permissions);

            res.json({ message: 'Member role updated successfully' });
        } catch (error) {
            console.error('Error updating member role:', error);
            if (error.message === 'Team member not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: 'Failed to update member role' });
        }
    },

    // Add task
    async addTask(req, res) {
        try {
            const taskData = {
                ...req.body,
                createdBy: req.user._id
            };
            const projectId = req.params.projectId;

            const team = await Team.findOne({ project: projectId });

            if (!team) {
                return res.status(404).json({ message: 'Team not found' });
            }

            // Check if user is a team member
            const isMember = team.members.find(member =>
                member.user.toString() === req.user._id.toString()
            );

            if (!isMember) {
                return res.status(403).json({ message: 'Not authorized to add tasks' });
            }

            await team.addTask(taskData);

            res.json({ message: 'Task added successfully' });
        } catch (error) {
            console.error('Error adding task:', error);
            res.status(500).json({ message: 'Failed to add task' });
        }
    },

    // Update task
    async updateTask(req, res) {
        try {
            const { taskId } = req.params;
            const projectId = req.params.projectId;
            const updates = req.body;

            const team = await Team.findOne({ project: projectId });

            if (!team) {
                return res.status(404).json({ message: 'Team not found' });
            }

            // Check if user is a team member
            const isMember = team.members.find(member =>
                member.user.toString() === req.user._id.toString()
            );

            if (!isMember) {
                return res.status(403).json({ message: 'Not authorized to update tasks' });
            }

            await team.updateTask(taskId, updates);

            res.json({ message: 'Task updated successfully' });
        } catch (error) {
            console.error('Error updating task:', error);
            if (error.message === 'Task not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: 'Failed to update task' });
        }
    },

    // Add task comment
    async addTaskComment(req, res) {
        try {
            const { taskId } = req.params;
            const projectId = req.params.projectId;
            const { content } = req.body;

            const team = await Team.findOne({ project: projectId });

            if (!team) {
                return res.status(404).json({ message: 'Team not found' });
            }

            // Check if user is a team member
            const isMember = team.members.find(member =>
                member.user.toString() === req.user._id.toString()
            );

            if (!isMember) {
                return res.status(403).json({ message: 'Not authorized to add comments' });
            }

            await team.addTaskComment(taskId, req.user._id, content);

            res.json({ message: 'Comment added successfully' });
        } catch (error) {
            console.error('Error adding task comment:', error);
            if (error.message === 'Task not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: 'Failed to add comment' });
        }
    },

    // Create communication channel
    async createChannel(req, res) {
        try {
            const channelData = {
                ...req.body,
                createdBy: req.user._id
            };
            const projectId = req.params.projectId;

            const team = await Team.findOne({ project: projectId });

            if (!team) {
                return res.status(404).json({ message: 'Team not found' });
            }

            // Check if user is a team member
            const isMember = team.members.find(member =>
                member.user.toString() === req.user._id.toString()
            );

            if (!isMember) {
                return res.status(403).json({ message: 'Not authorized to create channels' });
            }

            await team.createChannel(channelData);

            res.json({ message: 'Channel created successfully' });
        } catch (error) {
            console.error('Error creating channel:', error);
            res.status(500).json({ message: 'Failed to create channel' });
        }
    },

    // Schedule meeting
    async scheduleMeeting(req, res) {
        try {
            const meetingData = {
                ...req.body,
                createdBy: req.user._id
            };
            const projectId = req.params.projectId;

            const team = await Team.findOne({ project: projectId });

            if (!team) {
                return res.status(404).json({ message: 'Team not found' });
            }

            // Check if user is a team member
            const isMember = team.members.find(member =>
                member.user.toString() === req.user._id.toString()
            );

            if (!isMember) {
                return res.status(403).json({ message: 'Not authorized to schedule meetings' });
            }

            await team.scheduleMeeting(meetingData);

            res.json({ message: 'Meeting scheduled successfully' });
        } catch (error) {
            console.error('Error scheduling meeting:', error);
            res.status(500).json({ message: 'Failed to schedule meeting' });
        }
    },

    // Add resource
    async addResource(req, res) {
        try {
            const resourceData = {
                ...req.body,
                uploadedBy: req.user._id
            };
            const projectId = req.params.projectId;

            const team = await Team.findOne({ project: projectId });

            if (!team) {
                return res.status(404).json({ message: 'Team not found' });
            }

            // Check if user is a team member
            const isMember = team.members.find(member =>
                member.user.toString() === req.user._id.toString()
            );

            if (!isMember) {
                return res.status(403).json({ message: 'Not authorized to add resources' });
            }

            await team.addResource(resourceData);

            res.json({ message: 'Resource added successfully' });
        } catch (error) {
            console.error('Error adding resource:', error);
            res.status(500).json({ message: 'Failed to add resource' });
        }
    },

    // Get team performance
    async getTeamPerformance(req, res) {
        try {
            const projectId = req.params.projectId;

            const team = await Team.findOne({ project: projectId });

            if (!team) {
                return res.status(404).json({ message: 'Team not found' });
            }

            // Check if user is a team member
            const isMember = team.members.find(member =>
                member.user.toString() === req.user._id.toString()
            );

            if (!isMember) {
                return res.status(403).json({ message: 'Not authorized to view team performance' });
            }

            const performance = team.getTeamPerformance();

            res.json(performance);
        } catch (error) {
            console.error('Error fetching team performance:', error);
            res.status(500).json({ message: 'Failed to fetch team performance' });
        }
    },

    // Get user's teams
    async getUserTeams(req, res) {
        try {
            const userId = req.user._id;

            const teams = await Team.findByMember(userId);

            res.json({ teams });
        } catch (error) {
            console.error('Error fetching user teams:', error);
            res.status(500).json({ message: 'Failed to fetch user teams' });
        }
    },

    // Get team analytics
    async getTeamAnalytics(req, res) {
        try {
            const projectId = req.params.projectId;

            const team = await Team.findOne({ project: projectId });

            if (!team) {
                return res.status(404).json({ message: 'Team not found' });
            }

            // Check if user is a team member
            const isMember = team.members.find(member =>
                member.user.toString() === req.user._id.toString()
            );

            if (!isMember) {
                return res.status(403).json({ message: 'Not authorized to view team analytics' });
            }

            const analytics = {
                overview: {
                    teamSize: team.teamSize,
                    taskCompletionRate: team.taskCompletionRate,
                    totalTasks: team.stats.totalTasks,
                    completedTasks: team.stats.completedTasks,
                    activeMembers: team.stats.activeMembers
                },
                tasks: {
                    byStatus: {
                        todo: team.tasks.filter(task => task.status === 'todo').length,
                        inProgress: team.tasks.filter(task => task.status === 'in-progress').length,
                        review: team.tasks.filter(task => task.status === 'review').length,
                        completed: team.tasks.filter(task => task.status === 'completed').length
                    },
                    byPriority: {
                        low: team.tasks.filter(task => task.priority === 'low').length,
                        medium: team.tasks.filter(task => task.priority === 'medium').length,
                        high: team.tasks.filter(task => task.priority === 'high').length,
                        urgent: team.tasks.filter(task => task.priority === 'urgent').length
                    }
                },
                communication: {
                    channels: team.communication.channels.length,
                    meetings: team.communication.meetings.length,
                    upcomingMeetings: team.communication.meetings.filter(meeting =>
                        new Date(meeting.scheduledAt) > new Date()
                    ).length
                },
                resources: {
                    documents: team.resources.documents.length,
                    tools: team.resources.tools.length,
                    links: team.resources.links.length
                },
                memberPerformance: team.getTeamPerformance().memberPerformance
            };

            res.json(analytics);
        } catch (error) {
            console.error('Error fetching team analytics:', error);
            res.status(500).json({ message: 'Failed to fetch team analytics' });
        }
    }
};

module.exports = teamController;

