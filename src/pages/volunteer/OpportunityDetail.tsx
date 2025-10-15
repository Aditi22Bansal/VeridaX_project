import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MapPin,
  Clock,
  Users,
  Star,
  Calendar,
  Building2,
  Target,
  Heart,
  Award,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  BookOpen,
  TrendingUp,
  ArrowLeft,
  Share2,
  Bookmark
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  required: boolean;
}

interface Location {
  type: 'remote' | 'on-site' | 'hybrid';
  city?: string;
  country?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface Schedule {
  startDate: string;
  endDate?: string;
  duration: 'one-time' | 'short-term' | 'long-term' | 'ongoing';
  hoursPerWeek?: {
    min: number;
    max: number;
  };
  flexible: boolean;
  timeSlots?: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
}

interface Organization {
  name: string;
  id: string;
  logo?: string;
  website?: string;
}

interface Impact {
  description: string;
  metrics: Array<{
    name: string;
    target: number;
    current: number;
    unit: string;
  }>;
  beneficiaries: string;
}

interface SkillGapAnalysis {
  opportunity: {
    title: string;
    organization: string;
  };
  currentMatch: number;
  targetMatch: number;
  skillGaps: Array<{
    skill: string;
    level: string;
    isRequired: boolean;
  }>;
  learningPath: Array<{
    skill: string;
    currentLevel: string;
    targetLevel: string;
    priority: string;
    resources: string[];
    estimatedTime: string;
  }>;
  timeline: {
    totalWeeks: number;
    totalMonths: number;
    startDate: string;
    estimatedCompletion: string;
    milestones: Array<{
      skill: string;
      targetLevel: string;
      estimatedCompletion: string;
    }>;
  };
}

const OpportunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [opportunity, setOpportunity] = useState<any>(null);
  const [skillGapAnalysis, setSkillGapAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchOpportunity();
    }
  }, [id]);

  const fetchOpportunity = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/volunteer-opportunities/${id}`);
      const data = await response.json();

      if (response.ok) {
        setOpportunity(data);
        setIsApplied(data.applications?.some((app: any) =>
          app.volunteer._id === user?._id
        ) || false);
      } else {
        throw new Error(data.message || 'Failed to fetch opportunity');
      }
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      toast({
        title: "Error",
        description: "Failed to fetch opportunity details.",
        variant: "destructive",
      });
      navigate('/volunteer/opportunities');
    } finally {
      setLoading(false);
    }
  };

  const analyzeSkillGaps = async () => {
    if (!user) return;

    try {
      setAnalyzing(true);
      const response = await fetch(`/api/volunteer-opportunities/${id}/skill-gaps`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setSkillGapAnalysis(data);
      } else {
        throw new Error(data.message || 'Failed to analyze skill gaps');
      }
    } catch (error) {
      console.error('Error analyzing skill gaps:', error);
      toast({
        title: "Error",
        description: "Failed to analyze skill gaps.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to apply for this opportunity.",
        variant: "destructive",
      });
      return;
    }

    try {
      setApplying(true);
      const response = await fetch(`/api/volunteer-opportunities/${id}/apply`, {
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
        setIsApplied(true);
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
    } finally {
      setApplying(false);
    }
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

  const getDurationColor = (duration: string) => {
    switch (duration) {
      case 'one-time': return 'bg-green-100 text-green-800';
      case 'short-term': return 'bg-blue-100 text-blue-800';
      case 'long-term': return 'bg-purple-100 text-purple-800';
      case 'ongoing': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLocationText = (location: Location) => {
    if (location.type === 'remote') {
      return 'Remote';
    }
    if (location.city && location.country) {
      return `${location.city}, ${location.country}`;
    }
    return 'On-site';
  };

  const getHoursText = (schedule: Schedule) => {
    if (schedule.hoursPerWeek) {
      const { min, max } = schedule.hoursPerWeek;
      if (min === max) {
        return `${min} hours per week`;
      }
      return `${min}-${max} hours per week`;
    }
    return 'Flexible hours';
  };

  const isFull = opportunity?.currentVolunteers >= opportunity?.maxVolunteers;
  const applicationDeadline = opportunity?.schedule?.endDate ?
    new Date(opportunity.schedule.endDate) : null;
  const isExpired = applicationDeadline && applicationDeadline < new Date();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Opportunity not found
              </h3>
              <p className="text-gray-600 mb-4">
                The opportunity you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/volunteer/opportunities')}>
                Browse Opportunities
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/volunteer/opportunities')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Opportunities
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {opportunity.title}
              </h1>
              <div className="flex items-center gap-4 text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{opportunity.organization.name}</span>
                  {opportunity.organization.website && (
                    <a
                      href={opportunity.organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{getLocationText(opportunity.location)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Starts {formatDate(opportunity.schedule.startDate)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{opportunity.category}</Badge>
                <Badge className={getDurationColor(opportunity.schedule.duration)}>
                  {opportunity.schedule.duration.replace('-', ' ')}
                </Badge>
                {opportunity.subcategory && (
                  <Badge variant="secondary">{opportunity.subcategory}</Badge>
                )}
                {opportunity.location.type === 'remote' && (
                  <Badge variant="outline" className="text-green-600">
                    Remote
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Bookmark className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="impact">Impact</TabsTrigger>
                <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {opportunity.description}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Schedule & Time Commitment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Duration</h4>
                        <p className="text-gray-600">
                          {opportunity.schedule.duration.replace('-', ' ')}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Time Commitment</h4>
                        <p className="text-gray-600">
                          {getHoursText(opportunity.schedule)}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Start Date</h4>
                        <p className="text-gray-600">
                          {formatDate(opportunity.schedule.startDate)}
                        </p>
                      </div>
                      {opportunity.schedule.endDate && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">End Date</h4>
                          <p className="text-gray-600">
                            {formatDate(opportunity.schedule.endDate)}
                          </p>
                        </div>
                      )}
                    </div>

                    {opportunity.schedule.flexible && (
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          This opportunity offers flexible scheduling to accommodate your availability.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {opportunity.tags && opportunity.tags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {opportunity.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="requirements" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Required Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {opportunity.skills.map((skill, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{skill.name}</span>
                            {skill.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          <Badge className={getSkillLevelColor(skill.level)}>
                            {skill.level}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {opportunity.requirements && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Requirements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {opportunity.requirements.age && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Age</h4>
                          <p className="text-gray-600">
                            {opportunity.requirements.age.min} - {opportunity.requirements.age.max} years
                          </p>
                        </div>
                      )}
                      {opportunity.requirements.experience && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Experience Level</h4>
                          <p className="text-gray-600 capitalize">
                            {opportunity.requirements.experience}
                          </p>
                        </div>
                      )}
                      {opportunity.requirements.languages && opportunity.requirements.languages.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Languages</h4>
                          <div className="flex flex-wrap gap-2">
                            {opportunity.requirements.languages.map((lang, index) => (
                              <Badge key={index} variant="outline">{lang}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {opportunity.requirements.backgroundCheck && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-gray-600">Background check required</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="impact" className="space-y-6">
                {opportunity.impact && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Expected Impact</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">
                        {opportunity.impact.description}
                      </p>

                      {opportunity.impact.metrics && opportunity.impact.metrics.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900">Impact Metrics</h4>
                          {opportunity.impact.metrics.map((metric, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>{metric.name}</span>
                                <span>{metric.current} / {metric.target} {metric.unit}</span>
                              </div>
                              <Progress
                                value={(metric.current / metric.target) * 100}
                                className="h-2"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {opportunity.impact.beneficiaries && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 mb-2">Beneficiaries</h4>
                          <Badge variant="outline" className="capitalize">
                            {opportunity.impact.beneficiaries}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="skills" className="space-y-6">
                {user ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        AI-Powered Skill Analysis
                      </CardTitle>
                      <CardDescription>
                        Get personalized insights about your skill match and learning path
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {skillGapAnalysis ? (
                        <div className="space-y-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                              {skillGapAnalysis.currentMatch}%
                            </div>
                            <p className="text-gray-600">Current Skill Match</p>
                            <Progress
                              value={skillGapAnalysis.currentMatch}
                              className="mt-4 h-3"
                            />
                          </div>

                          {skillGapAnalysis.learningPath.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-4">Learning Path</h4>
                              <div className="space-y-4">
                                {skillGapAnalysis.learningPath.map((item, index) => (
                                  <div key={index} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="font-medium">{item.skill}</h5>
                                      <Badge
                                        variant={item.priority === 'high' ? 'destructive' : 'secondary'}
                                      >
                                        {item.priority} priority
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                      Improve from {item.currentLevel} to {item.targetLevel}
                                      (Estimated time: {item.estimatedTime})
                                    </p>
                                    <div className="space-y-1">
                                      <h6 className="text-sm font-medium">Learning Resources:</h6>
                                      <ul className="text-sm text-gray-600 space-y-1">
                                        {item.resources.map((resource, idx) => (
                                          <li key={idx} className="flex items-start gap-2">
                                            <BookOpen className="h-3 w-3 mt-1 flex-shrink-0" />
                                            <span>{resource}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">Timeline</h4>
                            <p className="text-sm text-blue-800">
                              Complete learning path in approximately {skillGapAnalysis.timeline.totalMonths} months
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Analyze Your Skills
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Get personalized insights about your skill match and learning recommendations
                          </p>
                          <Button onClick={analyzeSkillGaps} disabled={analyzing}>
                            {analyzing ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Analyze Skills
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Login Required
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Please log in to get personalized skill analysis and recommendations
                      </p>
                      <Button asChild>
                        <a href="/login">Log In</a>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Application Card */}
            <Card>
              <CardHeader>
                <CardTitle>Apply Now</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Volunteers</span>
                  <span className="font-medium">
                    {opportunity.currentVolunteers} / {opportunity.maxVolunteers}
                  </span>
                </div>
                <Progress
                  value={(opportunity.currentVolunteers / opportunity.maxVolunteers) * 100}
                  className="h-2"
                />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{opportunity.stats.rating.toFixed(1)}</span>
                    <span className="text-gray-500">({opportunity.stats.reviews})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Views</span>
                  <span className="font-medium">{opportunity.stats.views}</span>
                </div>

                {isApplied ? (
                  <Button disabled className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Applied
                  </Button>
                ) : isFull ? (
                  <Button disabled className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Full
                  </Button>
                ) : isExpired ? (
                  <Button disabled className="w-full">
                    <Clock className="h-4 w-4 mr-2" />
                    Expired
                  </Button>
                ) : (
                  <Button
                    onClick={handleApply}
                    disabled={applying}
                    className="w-full"
                  >
                    {applying ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Heart className="h-4 w-4 mr-2" />
                        Apply Now
                      </>
                    )}
                  </Button>
                )}

                {opportunity.schedule.endDate && (
                  <div className="text-center text-sm text-gray-500">
                    Application deadline: {formatDate(opportunity.schedule.endDate)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Organization Info */}
            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {opportunity.organization.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {opportunity.organization.website ? (
                      <a
                        href={opportunity.organization.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Visit Website
                      </a>
                    ) : (
                      'No website available'
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            {opportunity.benefits && (
              <Card>
                <CardHeader>
                  <CardTitle>Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {opportunity.benefits.training && opportunity.benefits.training.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Training</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {opportunity.benefits.training.map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Award className="h-3 w-3 mt-1 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {opportunity.benefits.certificates && opportunity.benefits.certificates.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Certificates</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {opportunity.benefits.certificates.map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Award className="h-3 w-3 mt-1 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {opportunity.benefits.references && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600">Reference letters available</span>
                      </div>
                    )}

                    {opportunity.benefits.networking && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-600">Networking opportunities</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetail;

