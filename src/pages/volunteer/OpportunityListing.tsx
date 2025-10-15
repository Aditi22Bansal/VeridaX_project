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
  RefreshCw
} from 'lucide-react';
import OpportunityCard from '@/components/volunteer/OpportunityCard';
import { toast } from '@/hooks/use-toast';

interface Opportunity {
  _id: string;
  title: string;
  description: string;
  organization: {
    name: string;
    id: string;
    logo?: string;
    website?: string;
  };
  category: string;
  subcategory?: string;
  skills: Array<{
    name: string;
    level: string;
    required: boolean;
  }>;
  location: {
    type: string;
    city?: string;
    country?: string;
  };
  schedule: {
    startDate: string;
    endDate?: string;
    duration: string;
    hoursPerWeek?: {
      min: number;
      max: number;
    };
  };
  maxVolunteers: number;
  currentVolunteers: number;
  status: string;
  tags: string[];
  stats: {
    views: number;
    applications: number;
    rating: number;
    reviews: number;
  };
  matchScore?: number;
  skillAnalysis?: any;
  reasons?: string[];
}

interface TrendingSkill {
  name: string;
  demand: number;
  averageLevel: string;
}

const OpportunityListing: React.FC = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [recommendations, setRecommendations] = useState<Opportunity[]>([]);
  const [trendingSkills, setTrendingSkills] = useState<TrendingSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [appliedOpportunities, setAppliedOpportunities] = useState<Set<string>>(new Set());

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState('');
  const [sortBy, setSortBy] = useState('relevance');

  const categories = [
    'Education', 'Healthcare', 'Environment', 'Technology', 'Arts & Culture',
    'Sports', 'Community Development', 'Animal Welfare', 'Disaster Relief',
    'Social Services', 'Research', 'Advocacy', 'Other'
  ];

  const durations = [
    'one-time', 'short-term', 'long-term', 'ongoing'
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'newest', label: 'Newest' },
    { value: 'deadline', label: 'Deadline' },
    { value: 'rating', label: 'Rating' },
    { value: 'match', label: 'Match Score' }
  ];

  useEffect(() => {
    fetchOpportunities();
    fetchTrendingSkills();
    if (user) {
      fetchRecommendations();
      fetchUserApplications();
    }
  }, [user]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery || selectedCategory || selectedLocation || selectedSkills.length > 0 || selectedDuration) {
        searchOpportunities();
      } else {
        fetchOpportunities();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory, selectedLocation, selectedSkills, selectedDuration, sortBy]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '20',
        sortBy: sortBy === 'relevance' ? 'createdAt' : sortBy,
        sortOrder: sortBy === 'newest' ? 'desc' : 'asc'
      });

      const response = await fetch(`/api/volunteer-opportunities?${params}`);
      const data = await response.json();

      if (response.ok) {
        setOpportunities(data.opportunities || []);
      } else {
        throw new Error(data.message || 'Failed to fetch opportunities');
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast({
        title: "Error",
        description: "Failed to fetch opportunities. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/volunteer-opportunities/recommendations/personalized?limit=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const fetchTrendingSkills = async () => {
    try {
      const response = await fetch('/api/volunteer-opportunities/trending-skills?limit=10');
      const data = await response.json();

      if (response.ok) {
        setTrendingSkills(data.skills || []);
      }
    } catch (error) {
      console.error('Error fetching trending skills:', error);
    }
  };

  const fetchUserApplications = async () => {
    try {
      const response = await fetch('/api/volunteer-opportunities/applications/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        const appliedIds = new Set(data.map((app: any) => app.opportunity.id));
        setAppliedOpportunities(appliedIds);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const searchOpportunities = async () => {
    try {
      setSearchLoading(true);
      const params = new URLSearchParams({
        query: searchQuery,
        category: selectedCategory,
        location: selectedLocation,
        skills: selectedSkills.join(','),
        duration: selectedDuration,
        sortBy: sortBy === 'relevance' ? 'createdAt' : sortBy,
        sortOrder: sortBy === 'newest' ? 'desc' : 'asc'
      });

      const response = await fetch(`/api/volunteer-opportunities/search?${params}`, {
        headers: user ? {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        } : {}
      });
      const data = await response.json();

      if (response.ok) {
        setOpportunities(data.opportunities || []);
      } else {
        throw new Error(data.message || 'Failed to search opportunities');
      }
    } catch (error) {
      console.error('Error searching opportunities:', error);
      toast({
        title: "Error",
        description: "Failed to search opportunities. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleApply = async (opportunityId: string) => {
    try {
      const response = await fetch(`/api/volunteer-opportunities/${opportunityId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          message: 'I am interested in this opportunity and would like to contribute my skills.',
          availability: 'Flexible',
          experience: 'I have relevant experience in this field.',
          motivation: 'I want to make a positive impact in the community.'
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Application Submitted",
          description: "Your application has been submitted successfully.",
        });
        setAppliedOpportunities(prev => new Set([...prev, opportunityId]));
      } else {
        throw new Error(data.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying to opportunity:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLocation('');
    setSelectedSkills([]);
    setSelectedDuration('');
    setSortBy('relevance');
  };

  const getCurrentOpportunities = () => {
    switch (activeTab) {
      case 'recommended':
        return recommendations;
      case 'all':
      default:
        return opportunities;
    }
  };

  const getTabCount = () => {
    switch (activeTab) {
      case 'recommended':
        return recommendations.length;
      case 'all':
      default:
        return opportunities.length;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Volunteer Opportunities
          </h1>
          <p className="text-gray-600">
            Find meaningful volunteer opportunities that match your skills and interests
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search opportunities..."
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
                  placeholder="City, Country"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                />
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

              {(searchQuery || selectedCategory || selectedLocation || selectedDuration) && (
                <Button variant="outline" onClick={searchOpportunities} disabled={searchLoading}>
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

        {/* Trending Skills */}
        {trendingSkills.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending Skills
              </CardTitle>
              <CardDescription>
                Most in-demand skills in volunteering
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {trendingSkills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-50"
                    onClick={() => {
                      if (!selectedSkills.includes(skill.name)) {
                        setSelectedSkills([...selectedSkills, skill.name]);
                      }
                    }}
                  >
                    {skill.name} ({skill.demand})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="all">
              All Opportunities ({getTabCount()})
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
            ) : opportunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opportunities.map(opportunity => (
                  <OpportunityCard
                    key={opportunity._id}
                    opportunity={opportunity}
                    showMatchScore={!!opportunity.matchScore}
                    onApply={user ? handleApply : undefined}
                    isApplied={appliedOpportunities.has(opportunity._id)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No opportunities found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search criteria or browse all opportunities
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
                  {recommendations.map(opportunity => (
                    <OpportunityCard
                      key={opportunity._id}
                      opportunity={opportunity}
                      showMatchScore={true}
                      onApply={handleApply}
                      isApplied={appliedOpportunities.has(opportunity._id)}
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

export default OpportunityListing;

