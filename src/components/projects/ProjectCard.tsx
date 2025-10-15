import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  Globe,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  visibility: 'public' | 'private' | 'invite-only';
  location: {
    type: 'global' | 'regional' | 'local' | 'remote';
    countries?: string[];
    regions?: string[];
    cities?: string[];
  };
  timeline: {
    startDate: string;
    endDate?: string;
    duration: 'short-term' | 'medium-term' | 'long-term' | 'ongoing';
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

interface ProjectCardProps {
  project: Project;
  showMatchScore?: boolean;
  onJoin?: (projectId: string) => void;
  isJoined?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  showMatchScore = false,
  onJoin,
  isJoined = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDurationColor = (duration: string) => {
    switch (duration) {
      case 'short-term': return 'bg-green-100 text-green-800';
      case 'medium-term': return 'bg-blue-100 text-blue-800';
      case 'long-term': return 'bg-purple-100 text-purple-800';
      case 'ongoing': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getLocationText = (location: Project['location']) => {
    if (location.type === 'global') {
      return 'Global';
    }
    if (location.type === 'remote') {
      return 'Remote';
    }
    if (location.cities && location.cities.length > 0) {
      return location.cities.slice(0, 2).join(', ');
    }
    if (location.countries && location.countries.length > 0) {
      return location.countries.slice(0, 2).join(', ');
    }
    return 'Local';
  };

  const getCompletionPercentage = () => {
    if (project.timeline.milestones.length === 0) return 0;
    const completed = project.timeline.milestones.filter(m => m.completed).length;
    return Math.round((completed / project.timeline.milestones.length) * 100);
  };

  const isFull = project.team.members.length >= project.team.maxMembers;
  const isExpired = project.timeline.endDate && new Date(project.timeline.endDate) < new Date();

  return (
    <Card className={`h-full transition-all duration-200 hover:shadow-lg ${
      showMatchScore && project.matchScore ? 'border-l-4 border-l-blue-500' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 mb-2">
              {project.title}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Building2 className="h-4 w-4" />
              <span>{project.creator.name}</span>
              {project.organization && (
                <>
                  <span>•</span>
                  <span>{project.organization.name}</span>
                  {project.organization.website && (
                    <a
                      href={project.organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{getLocationText(project.location)}</span>
            </div>
          </div>

          {showMatchScore && project.matchScore && (
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {project.matchScore}%
              </div>
              <div className="text-xs text-gray-500">Match</div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <CardDescription className="line-clamp-3 mb-4">
          {project.shortDescription || project.description}
        </CardDescription>

        {/* Status and Duration */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
          <Badge className={getDurationColor(project.timeline.duration)}>
            {project.timeline.duration.replace('-', ' ')}
          </Badge>
          {project.subcategory && (
            <Badge variant="secondary">{project.subcategory}</Badge>
          )}
          {project.location.type === 'remote' && (
            <Badge variant="outline" className="text-green-600">
              <Globe className="h-3 w-3 mr-1" />
              Remote
            </Badge>
          )}
        </div>

        {/* Progress */}
        {project.timeline.milestones.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{getCompletionPercentage()}%</span>
            </div>
            <Progress value={getCompletionPercentage()} className="h-2" />
          </div>
        )}

        {/* Goals */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Primary Goal</div>
          <p className="text-sm text-gray-600 line-clamp-2">
            {project.goals.primary}
          </p>
        </div>

        {/* Success Metrics */}
        {project.goals.successMetrics.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Impact Metrics</div>
            <div className="space-y-2">
              {project.goals.successMetrics.slice(0, 2).map((metric, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{metric.name}</span>
                  <span className="font-medium">
                    {metric.current} / {metric.target} {metric.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Info */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Team</span>
            <span className="font-medium">
              {project.team.members.length} / {project.team.maxMembers}
            </span>
          </div>
          <Progress
            value={(project.team.members.length / project.team.maxMembers) * 100}
            className="h-2 mb-2"
          />
          {project.team.openPositions.length > 0 && (
            <div className="text-xs text-blue-600">
              {project.team.openPositions.length} open positions
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>Starts {formatDate(project.timeline.startDate)}</span>
          </div>
          {project.timeline.endDate && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>Ends {formatDate(project.timeline.endDate)}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{project.team.members.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              <span>{project.stats.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span>{project.stats.views}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link to={`/projects/${project._id}`}>
              View Details
            </Link>
          </Button>

          {onJoin && !isJoined && !isFull && !isExpired && project.status === 'active' && (
            <Button
              onClick={() => onJoin(project._id)}
              className="flex-1"
            >
              Join Project
            </Button>
          )}

          {isJoined && (
            <Button variant="outline" className="flex-1" disabled>
              <Heart className="h-4 w-4 mr-2" />
              Joined
            </Button>
          )}

          {isFull && (
            <Button variant="outline" className="flex-1" disabled>
              <Users className="h-4 w-4 mr-2" />
              Full
            </Button>
          )}

          {isExpired && (
            <Button variant="outline" className="flex-1" disabled>
              <Clock className="h-4 w-4 mr-2" />
              Expired
            </Button>
          )}
        </div>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 5).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectCard;

