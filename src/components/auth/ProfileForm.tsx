import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, MapPin, Globe, Mail, Phone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: string;
}

interface Location {
  country: string;
  city: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  github?: string;
  website?: string;
}

interface Preferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    showEmail: boolean;
    showPhone: boolean;
  };
  language: string;
  timezone: string;
}

const ProfileForm: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Form states
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    bio: '',
    phone: '',
    address: ''
  });

  const [skills, setSkills] = useState<Skill[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [location, setLocation] = useState<Location>({
    country: '',
    city: ''
  });
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [preferences, setPreferences] = useState<Preferences>({
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false
    },
    language: 'en',
    timezone: 'UTC'
  });

  // New skill form
  const [newSkill, setNewSkill] = useState({
    name: '',
    level: 'beginner' as const,
    category: ''
  });

  // New interest
  const [newInterest, setNewInterest] = useState('');

  // Skill categories
  const skillCategories = [
    'Technology', 'Education', 'Healthcare', 'Environment', 'Arts & Culture',
    'Sports', 'Business', 'Language', 'Cooking', 'Music', 'Writing',
    'Photography', 'Design', 'Engineering', 'Science', 'Other'
  ];

  useEffect(() => {
    if (user) {
      setBasicInfo({
        name: user.name || '',
        bio: user.bio || '',
        phone: user.phone || '',
        address: user.address || ''
      });
      setSkills(user.skills || []);
      setInterests(user.interests || []);
      setLocation(user.location || { country: '', city: '' });
      setSocialLinks(user.socialLinks || {});
      setPreferences(user.preferences || {
        notifications: { email: true, push: true, sms: false },
        privacy: { profileVisibility: 'public', showEmail: false, showPhone: false },
        language: 'en',
        timezone: 'UTC'
      });
    }
  }, [user]);

  const handleBasicInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUser(basicInfo);
      toast({
        title: "Profile Updated",
        description: "Your basic information has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkillsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUser({ skills });
      toast({
        title: "Skills Updated",
        description: "Your skills have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update skills. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInterestsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUser({ interests });
      toast({
        title: "Interests Updated",
        description: "Your interests have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update interests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUser({ location });
      toast({
        title: "Location Updated",
        description: "Your location has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLinksSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUser({ socialLinks });
      toast({
        title: "Social Links Updated",
        description: "Your social links have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update social links. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUser({ preferences });
      toast({
        title: "Preferences Updated",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.name && newSkill.category) {
      setSkills([...skills, { ...newSkill }]);
      setNewSkill({ name: '', level: 'beginner', category: '' });
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const addInterest = () => {
    if (newInterest && !interests.includes(newInterest)) {
      setInterests([...interests, newInterest]);
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Manage your personal information, skills, and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="interests">Interests</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="social">Social Links</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic">
              <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={basicInfo.name}
                      onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={basicInfo.phone}
                      onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={basicInfo.bio}
                    onChange={(e) => setBasicInfo({ ...basicInfo, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={basicInfo.address}
                    onChange={(e) => setBasicInfo({ ...basicInfo, address: e.target.value })}
                    placeholder="Your address"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Basic Info'}
                </Button>
              </form>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills">
              <form onSubmit={handleSkillsSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Skill name"
                      value={newSkill.name}
                      onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                    />
                    <Select
                      value={newSkill.category}
                      onValueChange={(value) => setNewSkill({ ...newSkill, category: value })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {skillCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={newSkill.level}
                      onValueChange={(value: any) => setNewSkill({ ...newSkill, level: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" onClick={addSkill}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Your Skills</Label>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <Badge
                          key={index}
                          className={`${getSkillLevelColor(skill.level)} cursor-pointer`}
                          onClick={() => removeSkill(index)}
                        >
                          {skill.name} ({skill.level})
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Skills'}
                </Button>
              </form>
            </TabsContent>

            {/* Interests Tab */}
            <TabsContent value="interests">
              <form onSubmit={handleInterestsSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add an interest"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                  />
                  <Button type="button" onClick={addInterest}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Your Interests</Label>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeInterest(interest)}
                      >
                        {interest}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Interests'}
                </Button>
              </form>
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location">
              <form onSubmit={handleLocationSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={location.country}
                      onChange={(e) => setLocation({ ...location, country: e.target.value })}
                      placeholder="Your country"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={location.city}
                      onChange={(e) => setLocation({ ...location, city: e.target.value })}
                      placeholder="Your city"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Location'}
                </Button>
              </form>
            </TabsContent>

            {/* Social Links Tab */}
            <TabsContent value="social">
              <form onSubmit={handleSocialLinksSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      type="url"
                      value={socialLinks.linkedin || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  <div>
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      type="url"
                      value={socialLinks.twitter || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>
                  <div>
                    <Label htmlFor="github">GitHub</Label>
                    <Input
                      id="github"
                      type="url"
                      value={socialLinks.github || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })}
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={socialLinks.website || ''}
                      onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Social Links'}
                </Button>
              </form>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="email-notifications"
                        checked={preferences.notifications.email}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          notifications: { ...preferences.notifications, email: e.target.checked }
                        })}
                      />
                      <Label htmlFor="email-notifications">Email notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="push-notifications"
                        checked={preferences.notifications.push}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          notifications: { ...preferences.notifications, push: e.target.checked }
                        })}
                      />
                      <Label htmlFor="push-notifications">Push notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="sms-notifications"
                        checked={preferences.notifications.sms}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          notifications: { ...preferences.notifications, sms: e.target.checked }
                        })}
                      />
                      <Label htmlFor="sms-notifications">SMS notifications</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Privacy Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="profile-visibility">Profile Visibility</Label>
                      <Select
                        value={preferences.privacy.profileVisibility}
                        onValueChange={(value: any) => setPreferences({
                          ...preferences,
                          privacy: { ...preferences.privacy, profileVisibility: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="friends">Friends Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="show-email"
                        checked={preferences.privacy.showEmail}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          privacy: { ...preferences.privacy, showEmail: e.target.checked }
                        })}
                      />
                      <Label htmlFor="show-email">Show email on profile</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="show-phone"
                        checked={preferences.privacy.showPhone}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          privacy: { ...preferences.privacy, showPhone: e.target.checked }
                        })}
                      />
                      <Label htmlFor="show-phone">Show phone on profile</Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={preferences.language}
                      onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="ko">Korean</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={preferences.timezone}
                      onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                      placeholder="UTC"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Preferences'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileForm;

