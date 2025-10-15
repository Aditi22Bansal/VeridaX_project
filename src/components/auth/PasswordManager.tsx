import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Key, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const PasswordManager: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Change password form
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Forgot password form
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  // Reset password form
  const [resetPasswordForm, setResetPasswordForm] = useState({
    password: '',
    confirmPassword: ''
  });

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePassword = (password: string) => {
    const minLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers
    };
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    const passwordValidation = validatePassword(changePasswordForm.newPassword);
    if (!passwordValidation.isValid) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters long and contain uppercase, lowercase, and numbers.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: changePasswordForm.currentPassword,
          newPassword: changePasswordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Password changed successfully.",
        });
        setChangePasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        throw new Error(data.message || 'Failed to change password');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!forgotPasswordEmail) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: forgotPasswordEmail })
      });

      const data = await response.json();

      if (response.ok) {
        setForgotPasswordSent(true);
        toast({
          title: "Email Sent",
          description: "If your email exists in our system, you will receive password reset instructions.",
        });
      } else {
        throw new Error(data.message || 'Failed to send reset email');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const passwordValidation = validatePassword(changePasswordForm.newPassword);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={changePasswordForm.currentPassword}
                  onChange={(e) => setChangePasswordForm({
                    ...changePasswordForm,
                    currentPassword: e.target.value
                  })}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={changePasswordForm.newPassword}
                  onChange={(e) => setChangePasswordForm({
                    ...changePasswordForm,
                    newPassword: e.target.value
                  })}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Password strength indicator */}
              {changePasswordForm.newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="text-sm text-gray-600">Password requirements:</div>
                  <div className="space-y-1 text-xs">
                    <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${passwordValidation.minLength ? 'bg-green-600' : 'bg-red-600'}`} />
                      At least 6 characters
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${passwordValidation.hasUpperCase ? 'bg-green-600' : 'bg-red-600'}`} />
                      One uppercase letter
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${passwordValidation.hasLowerCase ? 'bg-green-600' : 'bg-red-600'}`} />
                      One lowercase letter
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-red-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${passwordValidation.hasNumbers ? 'bg-green-600' : 'bg-red-600'}`} />
                      One number
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={changePasswordForm.confirmPassword}
                  onChange={(e) => setChangePasswordForm({
                    ...changePasswordForm,
                    confirmPassword: e.target.value
                  })}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {changePasswordForm.confirmPassword &&
               changePasswordForm.newPassword !== changePasswordForm.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !passwordValidation.isValid ||
                       changePasswordForm.newPassword !== changePasswordForm.confirmPassword}
              className="w-full"
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Forgot Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Forgot Password
          </CardTitle>
          <CardDescription>
            Reset your password if you've forgotten it
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!forgotPasswordSent ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label htmlFor="forgotEmail">Email Address</Label>
                <Input
                  id="forgotEmail"
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={forgotPasswordLoading}
                className="w-full"
              >
                {forgotPasswordLoading ? 'Sending...' : 'Send Reset Email'}
              </Button>
            </form>
          ) : (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                If your email exists in our system, you will receive password reset instructions shortly.
                Please check your email and follow the instructions to reset your password.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Use a unique password that you don't use elsewhere</li>
            <li>• Include a mix of uppercase and lowercase letters, numbers, and symbols</li>
            <li>• Avoid using personal information like your name or birthdate</li>
            <li>• Consider using a password manager to generate and store secure passwords</li>
            <li>• Change your password regularly, especially if you suspect it may have been compromised</li>
            <li>• Never share your password with anyone</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordManager;

