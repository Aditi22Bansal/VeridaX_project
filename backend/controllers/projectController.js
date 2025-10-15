const Project = require('../models/Project');
const Team = require('../models/Team');
const User = require('../models/User');
const AIService = require('../services/aiService');

const projectController = {
    // Create a new project
    async createProject(req, res) {
        try {
            const projectData = {
                ...req.body,
                creator: req.user._id
            };

            const project = new Project(projectData);
            await project.save();

            // Create initial team with creator as leader
            const team = new Team({
                name: `${project.title} Team`,
                description: `Team for ${project.title}`,
                project: project._id,
                leader: req.user._id,
                members: [{
                    user: req.user._id,
                    role: 'Project Leader',
                    permissions: ['admin'],
                    status: 'active'
                }]
            });
            await team.save();

            // Add team reference to project
            project.team = team._id;
            await project.save();

            res.status(201).json({
                message: 'Project created successfully',
                project: project.toObject(),
                team: team.toObject()
            });
        } catch (error) {
            console.error('Error creating project:', error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    message: 'Validation error',
                    errors: Object.keys(error.errors).reduce((acc, key) => {
                        acc[key] = error.errors[key].message;
                        return acc;
                    }, {})
                });
            }
            res.status(500).json({ message: 'Failed to create project' });
        }
    },

    // Get all projects with filtering and pagination
    async getProjects(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                category,
                status = 'active',
                location,
                skills,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            const filter = { status, visibility: 'public' };

            // Apply filters
            if (category) filter.category = category;
            if (location) {
                filter.$or = [
                    { 'location.countries': new RegExp(location, 'i') },
                    { 'location.regions': new RegExp(location, 'i') },
                    { 'location.cities': new RegExp(location, 'i') }
                ];
            }
            if (skills) {
                const skillArray = skills.split(',');
                filter['team.requiredRoles.skills'] = { $in: skillArray };
            }

            const sortOptions = {};
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const projects = await Project.find(filter)
                .populate('creator', 'name email')
                .populate('team.members.user', 'name email')
                .sort(sortOptions)
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .exec();

            const total = await Project.countDocuments(filter);

            res.json({
                projects,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            });
        } catch (error) {
            console.error('Error fetching projects:', error);
            res.status(500).json({ message: 'Failed to fetch projects' });
        }
    },

    // Get project by ID
    async getProjectById(req, res) {
        try {
            const project = await Project.findById(req.params.id)
                .populate('creator', 'name email')
                .populate('team.members.user', 'name email skills')
                .populate('team.openPositions.applications.user', 'name email');

            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Increment view count
            project.stats.views += 1;
            await project.save();

            res.json(project);
        } catch (error) {
            console.error('Error fetching project:', error);
            res.status(500).json({ message: 'Failed to fetch project' });
        }
    },

    // Update project
    async updateProject(req, res) {
        try {
            const project = await Project.findById(req.params.id);

            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Check if user is the creator or has admin permissions
            const isCreator = project.creator.toString() === req.user._id.toString();
            const isAdmin = project.team.members.find(member =>
                member.user.toString() === req.user._id.toString() &&
                member.permissions.includes('admin')
            );

            if (!isCreator && !isAdmin) {
                return res.status(403).json({ message: 'Not authorized to update this project' });
            }

            const updatedProject = await Project.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            ).populate('creator', 'name email')
             .populate('team.members.user', 'name email');

            res.json({
                message: 'Project updated successfully',
                project: updatedProject
            });
        } catch (error) {
            console.error('Error updating project:', error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    message: 'Validation error',
                    errors: Object.keys(error.errors).reduce((acc, key) => {
                        acc[key] = error.errors[key].message;
                        return acc;
                    }, {})
                });
            }
            res.status(500).json({ message: 'Failed to update project' });
        }
    },

    // Delete project
    async deleteProject(req, res) {
        try {
            const project = await Project.findById(req.params.id);

            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Only creator can delete project
            if (project.creator.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to delete this project' });
            }

            // Delete associated team
            await Team.findOneAndDelete({ project: project._id });

            await Project.findByIdAndDelete(req.params.id);

            res.json({ message: 'Project deleted successfully' });
        } catch (error) {
            console.error('Error deleting project:', error);
            res.status(500).json({ message: 'Failed to delete project' });
        }
    },

    // Join project
    async joinProject(req, res) {
        try {
            const { role, message, skills, timeCommitment } = req.body;
            const projectId = req.params.id;
            const userId = req.user._id;

            const project = await Project.findById(projectId);

            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            if (project.status !== 'active') {
                return res.status(400).json({ message: 'Project is not currently accepting members' });
            }

            // Check if user is already a member
            const existingMember = project.team.members.find(member =>
                member.user.toString() === userId.toString()
            );

            if (existingMember) {
                return res.status(400).json({ message: 'You are already a member of this project' });
            }

            // Check if project has open positions
            if (project.team.openPositions.length === 0) {
                return res.status(400).json({ message: 'No open positions available' });
            }

            // Find suitable position
            const suitablePosition = project.team.openPositions.find(position =>
                position.role.toLowerCase() === role.toLowerCase()
            );

            if (!suitablePosition) {
                return res.status(400).json({ message: 'No suitable position found for the specified role' });
            }

            // Add application
            await project.applyForPosition(suitablePosition._id, userId, message);

            res.json({ message: 'Application submitted successfully' });
        } catch (error) {
            console.error('Error joining project:', error);
            if (error.message === 'Already applied for this position') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Failed to join project' });
        }
    },

    // Leave project
    async leaveProject(req, res) {
        try {
            const projectId = req.params.id;
            const userId = req.user._id;

            const project = await Project.findById(projectId);

            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Check if user is a member
            const member = project.team.members.find(member =>
                member.user.toString() === userId.toString()
            );

            if (!member) {
                return res.status(400).json({ message: 'You are not a member of this project' });
            }

            // Creator cannot leave project
            if (project.creator.toString() === userId.toString()) {
                return res.status(400).json({ message: 'Project creator cannot leave the project' });
            }

            await project.removeTeamMember(userId);

            res.json({ message: 'Successfully left the project' });
        } catch (error) {
            console.error('Error leaving project:', error);
            res.status(500).json({ message: 'Failed to leave project' });
        }
    },

    // Add team member (admin only)
    async addTeamMember(req, res) {
        try {
            const { userId, role, permissions } = req.body;
            const projectId = req.params.id;

            const project = await Project.findById(projectId);

            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Check if user has admin permissions
            const isAdmin = project.team.members.find(member =>
                member.user.toString() === req.user._id.toString() &&
                member.permissions.includes('admin')
            );

            if (!isAdmin) {
                return res.status(403).json({ message: 'Not authorized to add team members' });
            }

            await project.addTeamMember(userId, role, permissions);

            res.json({ message: 'Team member added successfully' });
        } catch (error) {
            console.error('Error adding team member:', error);
            if (error.message === 'User is already a team member') {
                return res.status(400).json({ message: error.message });
            }
            if (error.message === 'Project has reached maximum team size') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Failed to add team member' });
        }
    },

    // Remove team member (admin only)
    async removeTeamMember(req, res) {
        try {
            const { userId } = req.params;
            const projectId = req.params.projectId;

            const project = await Project.findById(projectId);

            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Check if user has admin permissions
            const isAdmin = project.team.members.find(member =>
                member.user.toString() === req.user._id.toString() &&
                member.permissions.includes('admin')
            );

            if (!isAdmin) {
                return res.status(403).json({ message: 'Not authorized to remove team members' });
            }

            await project.removeTeamMember(userId);

            res.json({ message: 'Team member removed successfully' });
        } catch (error) {
            console.error('Error removing team member:', error);
            res.status(500).json({ message: 'Failed to remove team member' });
        }
    },

    // Add task
    async addTask(req, res) {
        try {
            const taskData = {
                ...req.body,
                createdBy: req.user._id
            };
            const projectId = req.params.id;

            const project = await Project.findById(projectId);

            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Check if user is a team member
            const isMember = project.team.members.find(member =>
                member.user.toString() === req.user._id.toString()
            );

            if (!isMember) {
                return res.status(403).json({ message: 'Not authorized to add tasks' });
            }

            await project.addTask(taskData);

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
            const projectId = req.params.id;
            const updates = req.body;

            const project = await Project.findById(projectId);

            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Check if user is a team member
            const isMember = project.team.members.find(member =>
                member.user.toString() === req.user._id.toString()
            );

            if (!isMember) {
                return res.status(403).json({ message: 'Not authorized to update tasks' });
            }

            await project.updateTask(taskId, updates);

            res.json({ message: 'Task updated successfully' });
        } catch (error) {
            console.error('Error updating task:', error);
            if (error.message === 'Task not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: 'Failed to update task' });
        }
    },

    // Add milestone
    async addMilestone(req, res) {
        try {
            const milestoneData = req.body;
            const projectId = req.params.id;

            const project = await Project.findById(projectId);

            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Check if user has admin permissions
            const isAdmin = project.team.members.find(member =>
                member.user.toString() === req.user._id.toString() &&
                member.permissions.includes('admin')
            );

            if (!isAdmin) {
                return res.status(403).json({ message: 'Not authorized to add milestones' });
            }

            await project.addMilestone(milestoneData);

            res.json({ message: 'Milestone added successfully' });
        } catch (error) {
            console.error('Error adding milestone:', error);
            res.status(500).json({ message: 'Failed to add milestone' });
        }
    },

    // Complete milestone
    async completeMilestone(req, res) {
        try {
            const { milestoneId } = req.params;
            const projectId = req.params.id;

            const project = await Project.findById(projectId);

            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Check if user has admin permissions
            const isAdmin = project.team.members.find(member =>
                member.user.toString() === req.user._id.toString() &&
                member.permissions.includes('admin')
            );

            if (!isAdmin) {
                return res.status(403).json({ message: 'Not authorized to complete milestones' });
            }

            await project.completeMilestone(milestoneId);

            res.json({ message: 'Milestone completed successfully' });
        } catch (error) {
            console.error('Error completing milestone:', error);
            if (error.message === 'Milestone not found') {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: 'Failed to complete milestone' });
        }
    },

    // Get project analytics
    async getProjectAnalytics(req, res) {
        try {
            const projectId = req.params.id;

            const project = await Project.findById(projectId);

            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Check if user is a team member
            const isMember = project.team.members.find(member =>
                member.user.toString() === req.user._id.toString()
            );

            if (!isMember) {
                return res.status(403).json({ message: 'Not authorized to view analytics' });
            }

            const analytics = {
                overview: {
                    teamSize: project.teamSize,
                    completionPercentage: project.completionPercentage,
                    budgetUtilization: project.budgetUtilization,
                    totalTasks: project.collaboration.tasks.length,
                    completedTasks: project.collaboration.tasks.filter(task => task.status === 'completed').length
                },
                timeline: {
                    startDate: project.timeline.startDate,
                    endDate: project.timeline.endDate,
                    duration: project.timeline.duration,
                    milestones: project.timeline.milestones.map(milestone => ({
                        title: milestone.title,
                        dueDate: milestone.dueDate,
                        completed: milestone.completed,
                        completedAt: milestone.completedAt
                    }))
                },
                team: {
                    members: project.team.members.map(member => ({
                        user: member.user,
                        role: member.role,
                        status: member.status,
                        joinedAt: member.joinedAt
                    })),
                    openPositions: project.team.openPositions.length
                },
                tasks: {
                    byStatus: {
                        todo: project.collaboration.tasks.filter(task => task.status === 'todo').length,
                        inProgress: project.collaboration.tasks.filter(task => task.status === 'in-progress').length,
                        review: project.collaboration.tasks.filter(task => task.status === 'review').length,
                        completed: project.collaboration.tasks.filter(task => task.status === 'completed').length
                    },
                    byPriority: {
                        low: project.collaboration.tasks.filter(task => task.priority === 'low').length,
                        medium: project.collaboration.tasks.filter(task => task.priority === 'medium').length,
                        high: project.collaboration.tasks.filter(task => task.priority === 'high').length,
                        urgent: project.collaboration.tasks.filter(task => task.priority === 'urgent').length
                    }
                },
                impact: {
                    metrics: project.impact.metrics,
                    stories: project.impact.stories
                }
            };

            res.json(analytics);
        } catch (error) {
            console.error('Error fetching project analytics:', error);
            res.status(500).json({ message: 'Failed to fetch project analytics' });
        }
    },

    // Search projects
    async searchProjects(req, res) {
        try {
            const { query, category, location, skills, status = 'active' } = req.query;

            let filter = { status, visibility: 'public' };

            // Text search
            if (query) {
                filter.$or = [
                    { title: new RegExp(query, 'i') },
                    { description: new RegExp(query, 'i') },
                    { tags: { $in: [new RegExp(query, 'i')] } }
                ];
            }

            // Category filter
            if (category) {
                filter.category = category;
            }

            // Location filter
            if (location) {
                filter.$or = [
                    { 'location.countries': new RegExp(location, 'i') },
                    { 'location.regions': new RegExp(location, 'i') },
                    { 'location.cities': new RegExp(location, 'i') }
                ];
            }

            // Skills filter
            if (skills) {
                const skillArray = skills.split(',');
                filter['team.requiredRoles.skills'] = { $in: skillArray };
            }

            const projects = await Project.find(filter)
                .populate('creator', 'name email')
                .populate('team.members.user', 'name email')
                .limit(20);

            res.json({ projects });
        } catch (error) {
            console.error('Error searching projects:', error);
            res.status(500).json({ message: 'Failed to search projects' });
        }
    },

    // Get trending projects
    async getTrendingProjects(req, res) {
        try {
            const { limit = 10 } = req.query;
            const projects = await Project.getTrending(parseInt(limit));

            res.json({ projects });
        } catch (error) {
            console.error('Error fetching trending projects:', error);
            res.status(500).json({ message: 'Failed to fetch trending projects' });
        }
    },

    // Get user's projects
    async getUserProjects(req, res) {
        try {
            const userId = req.user._id;
            const { status } = req.query;

            let filter = {
                $or: [
                    { creator: userId },
                    { 'team.members.user': userId }
                ]
            };

            if (status) {
                filter.status = status;
            }

            const projects = await Project.find(filter)
                .populate('creator', 'name email')
                .populate('team.members.user', 'name email')
                .sort({ createdAt: -1 });

            res.json({ projects });
        } catch (error) {
            console.error('Error fetching user projects:', error);
            res.status(500).json({ message: 'Failed to fetch user projects' });
        }
    },

    // Get project statistics
    async getProjectStatistics(req, res) {
        try {
            const stats = await Project.aggregate([
                {
                    $group: {
                        _id: null,
                        totalProjects: { $sum: 1 },
                        activeProjects: {
                            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                        },
                        completedProjects: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                        },
                        totalTeamMembers: { $sum: { $size: '$team.members' } },
                        avgRating: { $avg: '$stats.rating' }
                    }
                }
            ]);

            const categoryStats = await Project.aggregate([
                { $match: { status: 'active' } },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            const locationStats = await Project.aggregate([
                { $match: { status: 'active' } },
                { $unwind: '$location.countries' },
                { $group: { _id: '$location.countries', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]);

            res.json({
                overall: stats[0] || {
                    totalProjects: 0,
                    activeProjects: 0,
                    completedProjects: 0,
                    totalTeamMembers: 0,
                    avgRating: 0
                },
                byCategory: categoryStats,
                byLocation: locationStats
            });
        } catch (error) {
            console.error('Error fetching project statistics:', error);
            res.status(500).json({ message: 'Failed to fetch project statistics' });
        }
    }
};

module.exports = projectController;

