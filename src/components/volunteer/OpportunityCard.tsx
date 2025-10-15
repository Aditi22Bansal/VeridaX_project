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
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
}

interface Organization {
  name: string;
  id: string;
  logo?: string;
  website?: string;
}

interface Opportunity {
  _id: string;
  title: string;
  description: string;
  organization: Organization;
  category: string;
  subcategory?: string;
  skills: Skill[];
  location: Location;
  schedule: Schedule;
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
  skillAnalysis?: {
    matchPercentage: number;
    matches: Array<{
      skill: string;
      userLevel: string;
      requiredLevel: string;
      score: number;
    }>;
    missing: Array<{
      skill: string;
      level: string;
      isRequired: boolean;
    }>;
  };
  reasons?: string[];
}

interface OpportunityCardProps {
  opportunity: Opportunity;
  showMatchScore?: boolean;
  onApply?: (opportunityId: string) => void;
  isApplied?: boolean;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  showMatchScore = false,
  onApply,
  isApplied = false
}) => {
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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
        return `${min} hours/week`;
      }
      return `${min}-${max} hours/week`;
    }
    return 'Flexible hours';
  };

  const isFull = opportunity.currentVolunteers >= opportunity.maxVolunteers;
  const applicationDeadline = opportunity.schedule.endDate ?
    new Date(opportunity.schedule.endDate) : null;
  const isExpired = applicationDeadline && applicationDeadline < new Date();

  return (
    <Card className={`h-full transition-all duration-200 hover:shadow-lg ${
      showMatchScore && opportunity.matchScore ? 'border-l-4 border-l-blue-500' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 mb-2">
              {opportunity.title}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
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
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{getLocationText(opportunity.location)}</span>
            </div>
          </div>

          {showMatchScore && opportunity.matchScore && (
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {opportunity.matchScore}%
              </div>
              <div className="text-xs text-gray-500">Match</div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <CardDescription className="line-clamp-3 mb-4">
          {opportunity.description}
        </CardDescription>

        {/* Category and Duration */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline">{opportunity.category}</Badge>
          <Badge className={getDurationColor(opportunity.schedule.duration)}>
            {opportunity.schedule.duration.replace('-', ' ')}
          </Badge>
          {opportunity.subcategory && (
            <Badge variant="secondary">{opportunity.subcategory}</Badge>
          )}
        </div>

        {/* Skills */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Required Skills</div>
          <div className="flex flex-wrap gap-1">
            {opportunity.skills.slice(0, 4).map((skill, index) => (
              <Badge
                key={index}
                className={`text-xs ${getSkillLevelColor(skill.level)} ${
                  skill.required ? 'ring-2 ring-red-300' : ''
                }`}
              >
                {skill.name}
                {skill.required && ' *'}
              </Badge>
            ))}
            {opportunity.skills.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{opportunity.skills.length - 4} more
              </Badge>
            )}
          </div>
        </div>

        {/* Match Analysis */}
        {showMatchScore && opportunity.skillAnalysis && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">Skill Match</div>
            <div className="flex items-center gap-2 mb-2">
              <Progress
                value={opportunity.skillAnalysis.matchPercentage}
                className="flex-1 h-2"
              />
              <span className="text-sm font-medium">
                {Math.round(opportunity.skillAnalysis.matchPercentage)}%
              </span>
            </div>
            {opportunity.skillAnalysis.matches.length > 0 && (
              <div className="text-xs text-green-600">
                ✓ {opportunity.skillAnalysis.matches.length} skills match
              </div>
            )}
            {opportunity.skillAnalysis.missing.length > 0 && (
              <div className="text-xs text-orange-600">
                ⚠ {opportunity.skillAnalysis.missing.length} skills needed
              </div>
            )}
          </div>
        )}

        {/* Match Reasons */}
        {opportunity.reasons && opportunity.reasons.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Why this matches you</div>
            <ul className="text-xs text-gray-600 space-y-1">
              {opportunity.reasons.slice(0, 3).map((reason, index) => (
                <li key={index} className="flex items-start gap-1">
                  <Heart className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Schedule Info */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>Starts {formatDate(opportunity.schedule.startDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>{getHoursText(opportunity.schedule)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{opportunity.currentVolunteers}/{opportunity.maxVolunteers}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              <span>{opportunity.stats.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span>{opportunity.stats.views} views</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link to={`/volunteer/opportunity/${opportunity._id}`}>
              View Details
            </Link>
          </Button>

          {onApply && !isApplied && !isFull && !isExpired && (
            <Button
              onClick={() => onApply(opportunity._id)}
              className="flex-1"
            >
              Apply Now
            </Button>
          )}

          {isApplied && (
            <Button variant="outline" className="flex-1" disabled>
              Applied
            </Button>
          )}

          {isFull && (
            <Button variant="outline" className="flex-1" disabled>
              Full
            </Button>
          )}

          {isExpired && (
            <Button variant="outline" className="flex-1" disabled>
              Expired
            </Button>
          )}
        </div>

        {/* Tags */}
        {opportunity.tags && opportunity.tags.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex flex-wrap gap-1">
              {opportunity.tags.slice(0, 5).map((tag, index) => (
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

export default OpportunityCard;

