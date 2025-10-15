const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const teamController = require('../controllers/teamController');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Public routes
router.get('/', projectController.getProjects);
router.get('/search', projectController.searchProjects);
router.get('/trending', projectController.getTrendingProjects);
router.get('/statistics', projectController.getProjectStatistics);
router.get('/:id', projectController.getProjectById);

// Protected routes
router.post('/', authenticateToken, projectController.createProject);
router.put('/:id', authenticateToken, projectController.updateProject);
router.delete('/:id', authenticateToken, projectController.deleteProject);

// Project collaboration routes
router.post('/:id/join', authenticateToken, projectController.joinProject);
router.post('/:id/leave', authenticateToken, projectController.leaveProject);
router.post('/:id/members', authenticateToken, projectController.addTeamMember);
router.delete('/:id/members/:userId', authenticateToken, projectController.removeTeamMember);

// Task management routes
router.post('/:id/tasks', authenticateToken, projectController.addTask);
router.put('/:id/tasks/:taskId', authenticateToken, projectController.updateTask);

// Milestone management routes
router.post('/:id/milestones', authenticateToken, projectController.addMilestone);
router.put('/:id/milestones/:milestoneId/complete', authenticateToken, projectController.completeMilestone);

// Analytics routes
router.get('/:id/analytics', authenticateToken, projectController.getProjectAnalytics);

// User projects
router.get('/user/my-projects', authenticateToken, projectController.getUserProjects);

// Team routes
router.get('/:projectId/team', authenticateToken, teamController.getTeamByProject);
router.put('/:projectId/team/settings', authenticateToken, teamController.updateTeamSettings);

// Team member management
router.post('/:projectId/team/members', authenticateToken, teamController.addTeamMember);
router.delete('/:projectId/team/members/:userId', authenticateToken, teamController.removeTeamMember);
router.put('/:projectId/team/members/:userId/role', authenticateToken, teamController.updateMemberRole);

// Team task management
router.post('/:projectId/team/tasks', authenticateToken, teamController.addTask);
router.put('/:projectId/team/tasks/:taskId', authenticateToken, teamController.updateTask);
router.post('/:projectId/team/tasks/:taskId/comments', authenticateToken, teamController.addTaskComment);

// Team communication
router.post('/:projectId/team/channels', authenticateToken, teamController.createChannel);
router.post('/:projectId/team/meetings', authenticateToken, teamController.scheduleMeeting);

// Team resources
router.post('/:projectId/team/resources', authenticateToken, upload.single('file'), teamController.addResource);

// Team analytics
router.get('/:projectId/team/performance', authenticateToken, teamController.getTeamPerformance);
router.get('/:projectId/team/analytics', authenticateToken, teamController.getTeamAnalytics);

// User teams
router.get('/user/teams', authenticateToken, teamController.getUserTeams);

module.exports = router;

