const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authController = {
    async register(req, res) {
        try {
            console.log('=== REGISTRATION START ===');
            console.log('Request received with body:', JSON.stringify(req.body, null, 2));

            const { name, email, password } = req.body;

            // Validate required fields
            if (!name || !email || !password) {
                console.log('Missing required fields:', {
                    name: !name,
                    email: !email,
                    password: !password
                });
                return res.status(400).json({
                    message: 'All fields are required',
                    missingFields: {
                        name: !name,
                        email: !email,
                        password: !password
                    }
                });
            }

            // Check if user already exists
            console.log('Checking if user exists:', email);
            let existingUser = await User.findOne({ email });
            if (existingUser) {
                console.log('User already exists:', email);
                return res.status(400).json({ message: 'User already exists' });
            }

            // Create new user
            console.log('Creating new user:', { name, email });
            const user = new User({
                name,
                email,
                password
            });

            console.log('Attempting to save user:', {
                name: user.name,
                email: user.email,
                password: user.password ? 'present' : 'missing'
            });

            // Save user and log result
            const savedUser = await user.save();
            console.log('User saved successfully:', {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email
            });

            // Generate JWT token
            const token = jwt.sign(
                { _id: savedUser._id.toString() },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            console.log('=== REGISTRATION SUCCESS ===');
            res.status(201).json({
                user: user.toJSON(),
                token
            });
        } catch (error) {
            console.error('=== REGISTRATION ERROR ===');
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });

            // Handle validation errors
            if (error.name === 'ValidationError') {
                console.error('Validation errors:', error.errors);
                return res.status(400).json({
                    message: 'Validation error',
                    errors: Object.keys(error.errors).reduce((acc, key) => {
                        acc[key] = error.errors[key].message;
                        return acc;
                    }, {})
                });
            }

            res.status(500).json({
                message: 'Server error',
                error: error.message
            });
        }
    },

    async login(req, res) {
        try {
            console.log('Login request received:', {
                email: req.body.email
            });

            const { email, password } = req.body;

            // Validate required fields
            if (!email || !password) {
                return res.status(400).json({
                    message: 'Email and password are required',
                    missingFields: {
                        email: !email,
                        password: !password
                    }
                });
            }

            // Check if user exists
            const user = await User.findOne({ email });
            if (!user) {
                console.log('User not found:', email);
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            // Check if account is locked
            if (user.accountLocked && user.lockUntil > new Date()) {
                console.log('Account is locked:', {
                    email: user.email,
                    lockUntil: user.lockUntil
                });

                const remainingTime = Math.ceil((user.lockUntil - new Date()) / 1000 / 60);
                return res.status(403).json({
                    message: `Account is locked. Please try again in ${remainingTime} minutes.`
                });
            }

            // Validate password
            const isMatch = await user.validatePassword(password);
            if (!isMatch) {
                const remainingAttempts = 5 - user.loginAttempts;
                return res.status(400).json({
                    message: `Invalid credentials. ${remainingAttempts} attempts remaining.`
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { _id: user._id.toString() },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            console.log('Login successful:', {
                userId: user._id,
                email: user.email
            });
            res.json({
                user: user.toJSON(),
                token
            });
        } catch (error) {
            console.error('Login error:', {
                message: error.message,
                stack: error.stack
            });

            res.status(500).json({
                message: 'Server error',
                error: error.message
            });
        }
    },

    async logout(req, res) {
        try {
            console.log('Logout request received:', {
                userId: req.user._id,
                email: req.user.email
            });

            // Remove the current token
            req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
            await req.user.save();

            console.log('User logged out successfully');
            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            console.error('Logout error:', {
                message: error.message,
                stack: error.stack
            });

            res.status(500).json({ message: 'Server error' });
        }
    },

    async getCurrentUser(req, res) {
        try {
            console.log('Get current user request:', {
                userId: req.user._id,
                email: req.user.email
            });

            res.json(req.user.toJSON());
        } catch (error) {
            console.error('Get current user error:', {
                message: error.message,
                stack: error.stack
            });

            res.status(500).json({ message: 'Server error' });
        }
    },

    async updateProfile(req, res) {
        try {
            console.log('Updating profile for user:', req.user._id);
            console.log('Update data:', req.body);

            const {
                name, bio, phone, address, skills, interests,
                location, socialLinks, preferences
            } = req.body;

            const updateData = {};
            if (name) updateData.name = name;
            if (bio) updateData.bio = bio;
            if (phone) updateData.phone = phone;
            if (address) updateData.address = address;
            if (skills) updateData.skills = skills;
            if (interests) updateData.interests = interests;
            if (location) updateData.location = location;
            if (socialLinks) updateData.socialLinks = socialLinks;
            if (preferences) updateData.preferences = preferences;

            const updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                updateData,
                { new: true, runValidators: true }
            ).select('-password -tokens -emailVerificationToken -passwordResetToken -passwordResetExpires');

            if (!updatedUser) {
                console.log('User not found:', req.user._id);
                return res.status(404).json({ message: 'User not found.' });
            }

            console.log('Profile updated successfully:', updatedUser);
            res.json({ user: updatedUser });
        } catch (error) {
            console.error('Error updating profile:', error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    message: 'Validation error',
                    errors: Object.keys(error.errors).reduce((acc, key) => {
                        acc[key] = error.errors[key].message;
                        return acc;
                    }, {})
                });
            }
            res.status(500).json({ message: 'Failed to update profile', error: error.message });
        }
    },

    async sendEmailVerification(req, res) {
        try {
            const user = req.user;

            if (user.isEmailVerified) {
                return res.status(400).json({ message: 'Email already verified' });
            }

            const token = user.generateEmailVerificationToken();
            await user.save();

            // In a real application, you would send an email here
            // For now, we'll just return the token for testing
            console.log('Email verification token:', token);

            res.json({
                message: 'Verification email sent',
                token: process.env.NODE_ENV === 'development' ? token : undefined
            });
        } catch (error) {
            console.error('Error sending email verification:', error);
            res.status(500).json({ message: 'Failed to send verification email' });
        }
    },

    async verifyEmail(req, res) {
        try {
            const { token } = req.params;
            const user = await User.findByEmailVerificationToken(token);

            if (!user) {
                return res.status(400).json({ message: 'Invalid or expired token' });
            }

            await user.verifyEmail();
            res.json({ message: 'Email verified successfully' });
        } catch (error) {
            console.error('Error verifying email:', error);
            res.status(400).json({ message: error.message });
        }
    },

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ message: 'Email is required' });
            }

            const user = await User.findOne({ email });
            if (!user) {
                // Don't reveal if email exists or not for security
                return res.json({ message: 'If email exists, password reset instructions have been sent' });
            }

            const token = user.generatePasswordResetToken();
            await user.save();

            // In a real application, you would send an email here
            console.log('Password reset token:', token);

            res.json({
                message: 'If email exists, password reset instructions have been sent',
                token: process.env.NODE_ENV === 'development' ? token : undefined
            });
        } catch (error) {
            console.error('Error in forgot password:', error);
            res.status(500).json({ message: 'Failed to process password reset request' });
        }
    },

    async resetPassword(req, res) {
        try {
            const { token } = req.params;
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({ message: 'Password is required' });
            }

            const user = await User.findByPasswordResetToken(token);
            if (!user) {
                return res.status(400).json({ message: 'Invalid or expired token' });
            }

            await user.resetPassword(password);
            res.json({ message: 'Password reset successfully' });
        } catch (error) {
            console.error('Error resetting password:', error);
            res.status(400).json({ message: error.message });
        }
    },

    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const user = req.user;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ message: 'Current password and new password are required' });
            }

            const isMatch = await user.validatePassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }

            user.password = newPassword;
            await user.save();

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error('Error changing password:', error);
            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    message: 'Validation error',
                    errors: Object.keys(error.errors).reduce((acc, key) => {
                        acc[key] = error.errors[key].message;
                        return acc;
                    }, {})
                });
            }
            res.status(500).json({ message: 'Failed to change password' });
        }
    },

    async addSkill(req, res) {
        try {
            const { name, level, category } = req.body;
            const user = req.user;

            if (!name || !category) {
                return res.status(400).json({ message: 'Skill name and category are required' });
            }

            const skillData = { name, level: level || 'beginner', category };
            await user.addSkill(skillData);

            res.json({ message: 'Skill added successfully', skills: user.skills });
        } catch (error) {
            console.error('Error adding skill:', error);
            res.status(500).json({ message: 'Failed to add skill' });
        }
    },

    async removeSkill(req, res) {
        try {
            const { skillName } = req.params;
            const user = req.user;

            await user.removeSkill(skillName);

            res.json({ message: 'Skill removed successfully', skills: user.skills });
        } catch (error) {
            console.error('Error removing skill:', error);
            res.status(500).json({ message: 'Failed to remove skill' });
        }
    },

    async updateStats(req, res) {
        try {
            const { statType, value } = req.body;
            const user = req.user;

            if (!statType || value === undefined) {
                return res.status(400).json({ message: 'Stat type and value are required' });
            }

            await user.updateStats(statType, value);

            res.json({ message: 'Stats updated successfully', stats: user.stats });
        } catch (error) {
            console.error('Error updating stats:', error);
            res.status(400).json({ message: error.message });
        }
    }
};

module.exports = authController;