import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Star,
  TrendingUp,
  Sparkles,
  Target,
  Users,
  Award,
  RefreshCw,
  Globe,
  Building2
} from 'lucide-react';
import ProjectCard from '@/components/projects/ProjectCard';
import { toast } from '@/hooks/use-toast';

interface Project {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  creator: {
    _id: string;
    name: string;
    email: string;
  };
  organization?: {
    name: string;
    id: string;
    logo?: string;
    website?: string;
  };
  category: string;
  subcategory?: string;
  status: string;
  visibility: string;
  location: {
    type: string;
    countries?: string[];
    regions?: string[];
    cities?: string[];
  };
  timeline: {
    startDate: string;
    endDate?: string;
    duration: string;
    milestones: Array<{
      title: string;
      dueDate: string;
      completed: boolean;
    }>;
  };
  team: {
    members: Array<{
      user: {
        _id: string;
        name: string;
        email: string;
      };
      role: string;
      status: string;
    }>;
    maxMembers: number;
    openPositions: Array<{
      role: string;
      description: string;
      requirements: string[];
    }>;
  };
  goals: {
    primary: string;
    successMetrics: Array<{
      name: string;
      target: number;
      current: number;
      unit: string;
    }>;
  };
  stats: {
    views: number;
    applications: number;
    shares: number;
    rating: number;
    reviews: number;
    completionRate: number;
  };
  tags: string[];
  isMember?: boolean;
  matchScore?: number;
}

const ProjectListing: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [recommendations, setRecommendations] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [joinedProjects, setJoinedProjects] = useState<Set<string>>(new Set());

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');

  const categories = [
    'Education', 'Healthcare', 'Environment', 'Technology', 'Arts & Culture',
    'Sports', 'Community Development', 'Animal Welfare', 'Disaster Relief',
    'Social Services', 'Research', 'Advocacy', 'Economic Development', 'Other'
  ];

  const durations = [
    'short-term', 'medium-term', 'long-term', 'ongoing'
  ];

  const statuses = [
    'planning', 'active', 'paused', 'completed'
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Newest' },
    { value: 'title', label: 'Title' },
    { value: 'stats.rating', label: 'Rating' },
    { value: 'timeline.startDate', label: 'Start Date' },
    { value: 'stats.views', label: 'Popularity' }
  ];

  useEffect(() => {
    fetchProjects();
    if (user) {
      fetchRecommendations();
      fetchUserProjects();
    }
  }, [user]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery || selectedCategory || selectedLocation || selectedStatus || selectedDuration) {
        searchProjects();
      } else {
        fetchProjects();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory, selectedLocation, selectedStatus, selectedDuration, sortBy]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '20',
        status: selectedStatus,
        sortBy,
        sortOrder: 'desc'
      });

      const response = await fetch(`/api/projects?${params}`);
      const data = await response.json();

      if (response.ok) {
        setProjects(data.projects || []);
      } else {
        throw new Error(data.message || 'Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/projects/recommendations?limit=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setRecommendations(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const fetchUserProjects = async () => {
    try {
      const response = await fetch('/api/projects/user/my-projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        const joinedIds = new Set(data.projects.map((project: Project) => project._id));
        setJoinedProjects(joinedIds);
      }
    } catch (error) {
      console.error('Error fetching user projects:', error);
    }
  };

  const searchProjects = async () => {
    try {
      setSearchLoading(true);
      const params = new URLSearchParams({
        query: searchQuery,
        category: selectedCategory,
        location: selectedLocation,
        status: selectedStatus,
        duration: selectedDuration,
        sortBy,
        sortOrder: 'desc'
      });

      const response = await fetch(`/api/projects/search?${params}`, {
        headers: user ? {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        } : {}
      });
      const data = await response.json();

      if (response.ok) {
        setProjects(data.projects || []);
      } else {
        throw new Error(data.message || 'Failed to search projects');
      }
    } catch (error) {
      console.error('Error searching projects:', error);
      toast({
        title: "Error",
        description: "Failed to search projects. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleJoin = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          role: 'Contributor',
          message: 'I am interested in contributing to this project.',
          skills: user?.skills?.map(skill => skill.name) || [],
          timeCommitment: '5-10 hours per week'
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Application Submitted",
          description: "Your application to join the project has been submitted successfully.",
        });
        setJoinedProjects(prev => new Set([...prev, projectId]));
      } else {
        throw new Error(data.message || 'Failed to join project');
      }
    } catch (error) {
      console.error('Error joining project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLocation('');
    setSelectedStatus('active');
    setSelectedDuration('');
    setSortBy('createdAt');
  };

  const getCurrentProjects = () => {
    switch (activeTab) {
      case 'recommended':
        return recommendations;
      case 'all':
      default:
        return projects;
    }
  };

  const getTabCount = () => {
    switch (activeTab) {
      case 'recommended':
        return recommendations.length;
      case 'all':
      default:
        return projects.length;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Global Projects
          </h1>
          <p className="text-gray-600">
            Join worldwide collaborative projects and make a global impact
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Country, Region"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="All durations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All durations</SelectItem>
                    {durations.map(duration => (
                      <SelectItem key={duration} value={duration}>
                        {duration.replace('-', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="sort">Sort by</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>

              {(searchQuery || selectedCategory || selectedLocation || selectedStatus || selectedDuration) && (
                <Button variant="outline" onClick={searchProjects} disabled={searchLoading}>
                  {searchLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Search
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="all">
              All Projects ({getTabCount()})
            </TabsTrigger>
            {user && (
              <TabsTrigger value="recommended">
                <Sparkles className="h-4 w-4 mr-2" />
                Recommended ({recommendations.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="all">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    showMatchScore={!!project.matchScore}
                    onJoin={user ? handleJoin : undefined}
                    isJoined={joinedProjects.has(project._id)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No projects found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search criteria or browse all projects
                  </p>
                  <Button onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {user && (
            <TabsContent value="recommended">
              {recommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.map(project => (
                    <ProjectCard
                      key={project._id}
                      project={project}
                      showMatchScore={true}
                      onJoin={handleJoin}
                      isJoined={joinedProjects.has(project._id)}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No recommendations yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Complete your profile with skills and interests to get personalized recommendations
                    </p>
                    <Button asChild>
                      <a href="/profile">Complete Profile</a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectListing;

