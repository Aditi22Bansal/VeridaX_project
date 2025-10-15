import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Settings,
  Lock,
  Mail,
  MapPin,
  Globe,
  Phone,
  Calendar,
  Award,
  Heart,
  Target,
  Star,
  Shield,
  CheckCircle
} from 'lucide-react';
import ProfileForm from '@/components/auth/ProfileForm';
import PasswordManager from '@/components/auth/PasswordManager';
import { toast } from '@/hooks/use-toast';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Please log in</h2>
              <p className="text-gray-600 mb-4">You need to be logged in to view your profile.</p>
              <Button asChild>
                <a href="/login">Go to Login</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-2xl">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                    <p className="text-gray-600">{user.bio || 'No bio available'}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      {user.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {user.phone}
                        </div>
                      )}
                      {user.location?.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {user.location.city}, {user.location.country}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={user.isEmailVerified ? "default" : "secondary"}>
                      {user.isEmailVerified ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </>
                      ) : (
                        'Unverified'
                      )}
                    </Badge>
                    <Badge variant="outline">
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile Settings</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Skills Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Skills
                  </CardTitle>
                  <CardDescription>
                    Your professional skills and expertise
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user.skills && user.skills.length > 0 ? (
                    <div className="space-y-2">
                      {user.skills.slice(0, 5).map((skill, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{skill.name}</span>
                          <Badge className={getSkillLevelColor(skill.level)}>
                            {skill.level}
                          </Badge>
                        </div>
                      ))}
                      {user.skills.length > 5 && (
                        <p className="text-sm text-gray-500">
                          +{user.skills.length - 5} more skills
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No skills added yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Interests Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Interests
                  </CardTitle>
                  <CardDescription>
                    Topics and causes you care about
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user.interests && user.interests.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.interests.slice(0, 6).map((interest, index) => (
                        <Badge key={index} variant="secondary">
                          {interest}
                        </Badge>
                      ))}
                      {user.interests.length > 6 && (
                        <Badge variant="outline">
                          +{user.interests.length - 6}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No interests added yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Social Links Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Social Links
                  </CardTitle>
                  <CardDescription>
                    Your online presence
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {user.socialLinks?.linkedin && (
                      <a
                        href={user.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Globe className="h-4 w-4" />
                        LinkedIn
                      </a>
                    )}
                    {user.socialLinks?.github && (
                      <a
                        href={user.socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                      >
                        <Globe className="h-4 w-4" />
                        GitHub
                      </a>
                    )}
                    {user.socialLinks?.twitter && (
                      <a
                        href={user.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-600"
                      >
                        <Globe className="h-4 w-4" />
                        Twitter
                      </a>
                    )}
                    {user.socialLinks?.website && (
                      <a
                        href={user.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-green-600 hover:text-green-800"
                      >
                        <Globe className="h-4 w-4" />
                        Website
                      </a>
                    )}
                    {!user.socialLinks?.linkedin && !user.socialLinks?.github &&
                     !user.socialLinks?.twitter && !user.socialLinks?.website && (
                      <p className="text-sm text-gray-500">No social links added</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member Since</label>
                    <p className="text-sm">{formatDate(user.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Login</label>
                    <p className="text-sm">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email Status</label>
                    <div className="flex items-center gap-2">
                      {user.isEmailVerified ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">Verified</span>
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-yellow-600">Unverified</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Account Type</label>
                    <p className="text-sm capitalize">{user.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Settings Tab */}
          <TabsContent value="profile">
            <ProfileForm />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <PasswordManager />
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Target className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Volunteer Hours</p>
                      <p className="text-2xl font-bold">{user.stats?.totalVolunteerHours || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Heart className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Donations</p>
                      <p className="text-2xl font-bold">${user.stats?.totalDonations || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Award className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Projects Completed</p>
                      <p className="text-2xl font-bold">{user.stats?.projectsCompleted || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Star className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Rating</p>
                      <p className="text-2xl font-bold">{user.stats?.rating || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Activity Summary</CardTitle>
                <CardDescription>
                  Your impact and contributions to the community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Campaigns Created</span>
                    <span className="text-sm">{user.stats?.campaignsCreated || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Reviews Received</span>
                    <span className="text-sm">{user.stats?.reviewsCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Skills Listed</span>
                    <span className="text-sm">{user.skills?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Interests Listed</span>
                    <span className="text-sm">{user.interests?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Logout Button */}
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;