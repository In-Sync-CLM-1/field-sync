import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Home, ClipboardList, Users, BarChart3, 
  Globe, Award, Settings, HelpCircle, ChevronRight, PlayCircle,
  BookOpen, Video, Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface TutorialVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  category: string;
}

interface TutorialCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  videos: TutorialVideo[];
  color: string;
}

const tutorialCategories: TutorialCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of In-Sync Field Force',
    icon: Lightbulb,
    color: 'bg-primary/10 text-primary',
    videos: [
      {
        id: 'gs-1',
        title: 'Welcome to In-Sync',
        description: 'An overview of the platform and its key features',
        duration: '3:45',
        category: 'getting-started',
      },
      {
        id: 'gs-2',
        title: 'Navigating the Dashboard',
        description: 'Learn how to use the main dashboard and understand your metrics',
        duration: '4:20',
        category: 'getting-started',
      },
      {
        id: 'gs-3',
        title: 'Setting Up Your Profile',
        description: 'Complete your profile and customize your preferences',
        duration: '2:30',
        category: 'getting-started',
      },
    ],
  },
  {
    id: 'daily-planning',
    title: 'Daily Planning',
    description: 'Master your daily sales planning workflow',
    icon: ClipboardList,
    color: 'bg-blue-500/10 text-blue-600',
    videos: [
      {
        id: 'dp-1',
        title: 'Creating Your Daily Plan',
        description: 'Set targets for prospects, quotes, and policies',
        duration: '5:15',
        category: 'daily-planning',
      },
      {
        id: 'dp-2',
        title: 'Tracking Daily Progress',
        description: 'Monitor your achievements and update actuals',
        duration: '3:50',
        category: 'daily-planning',
      },
      {
        id: 'dp-3',
        title: 'Linking Prospects to Policies',
        description: 'Use the Policy Dialog to connect prospects with issued policies',
        duration: '4:10',
        category: 'daily-planning',
      },
    ],
  },
  {
    id: 'team-branches',
    title: 'Team & Branches',
    description: 'Manage your team and branch locations',
    icon: Users,
    color: 'bg-green-500/10 text-green-600',
    videos: [
      {
        id: 'tb-1',
        title: 'Viewing Team Plans',
        description: 'Review and correct team member plans as a manager',
        duration: '4:45',
        category: 'team-branches',
      },
      {
        id: 'tb-2',
        title: 'Managing Branches',
        description: 'Add, edit, and organize your branch locations',
        duration: '3:30',
        category: 'team-branches',
      },
      {
        id: 'tb-3',
        title: 'Assigning Team Members',
        description: 'Assign sales officers to branches and reporting managers',
        duration: '4:00',
        category: 'team-branches',
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    description: 'Understand your performance data',
    icon: BarChart3,
    color: 'bg-purple-500/10 text-purple-600',
    videos: [
      {
        id: 'an-1',
        title: 'Reading the Analytics Dashboard',
        description: 'Understand visit trends, completion rates, and key metrics',
        duration: '5:30',
        category: 'analytics',
      },
      {
        id: 'an-2',
        title: 'Branch Performance Reports',
        description: 'Analyze team performance, commissions, and achievements',
        duration: '6:00',
        category: 'analytics',
      },
      {
        id: 'an-3',
        title: 'Using Date Filters',
        description: 'Filter reports by date range and month',
        duration: '2:45',
        category: 'analytics',
      },
    ],
  },
  {
    id: 'territory',
    title: 'Territory Management',
    description: 'Navigate and manage your sales territory',
    icon: Globe,
    color: 'bg-amber-500/10 text-amber-600',
    videos: [
      {
        id: 'tm-1',
        title: 'Using the Territory Map',
        description: 'View prospect locations and plan your visits geographically',
        duration: '4:20',
        category: 'territory',
      },
      {
        id: 'tm-2',
        title: 'Check-in and Check-out',
        description: 'Record visits with location tracking',
        duration: '3:15',
        category: 'territory',
      },
    ],
  },
  {
    id: 'admin',
    title: 'Administration',
    description: 'For admins: manage users and settings',
    icon: Settings,
    color: 'bg-red-500/10 text-red-600',
    videos: [
      {
        id: 'ad-1',
        title: 'Managing Users',
        description: 'Add, edit, and manage user accounts and roles',
        duration: '5:00',
        category: 'admin',
      },
      {
        id: 'ad-2',
        title: 'Subscription Management',
        description: 'View and manage your organization subscription',
        duration: '3:30',
        category: 'admin',
      },
      {
        id: 'ad-3',
        title: 'Planning Overview',
        description: 'Review all team plans and make administrative corrections',
        duration: '4:45',
        category: 'admin',
      },
    ],
  },
];

const faqs = [
  {
    question: 'How do I reset my password?',
    answer: 'Click on "Forgot Password" on the login screen. Enter your email address, and you\'ll receive a reset link via email.',
  },
  {
    question: 'How do I add a new prospect?',
    answer: 'Go to Leads from the sidebar, click "Add Lead", and fill in the prospect details including name, contact information, and policy type.',
  },
  {
    question: 'How do I check in to a visit?',
    answer: 'Navigate to the Territory map, select a prospect, and click "Check In". Your location will be recorded automatically.',
  },
  {
    question: 'What do the different status badges mean?',
    answer: 'Draft = Plan created but not submitted. Submitted = Awaiting review. Corrected = Manager made adjustments. Approved = Ready to execute.',
  },
  {
    question: 'How do I link a prospect to my daily policy target?',
    answer: 'Open your Daily Plan, click on the Policies target, and select "Link Prospect" to connect an existing prospect to your policy issuance.',
  },
  {
    question: 'Can I work offline?',
    answer: 'Yes! In-Sync works offline. Your data will sync automatically when you reconnect to the internet. Look for the sync status indicator.',
  },
];

export default function Tutorials() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('videos');
  const [selectedVideo, setSelectedVideo] = useState<TutorialVideo | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);

  const handlePlayVideo = (video: TutorialVideo) => {
    setSelectedVideo(video);
    setVideoDialogOpen(true);
  };

  const allVideos = tutorialCategories.flatMap(cat => cat.videos);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Button>
        <HelpCircle className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Help & Tutorials</h1>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-3 text-center">
            <Video className="h-6 w-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{allVideos.length}</p>
            <p className="text-xs text-muted-foreground">Video Tutorials</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardContent className="p-3 text-center">
            <BookOpen className="h-6 w-6 mx-auto mb-1 text-blue-600" />
            <p className="text-2xl font-bold">{tutorialCategories.length}</p>
            <p className="text-xs text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardContent className="p-3 text-center">
            <Lightbulb className="h-6 w-6 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold">{faqs.length}</p>
            <p className="text-xs text-muted-foreground">FAQs</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="videos" className="gap-2">
            <PlayCircle className="h-4 w-4" />
            Video Tutorials
          </TabsTrigger>
          <TabsTrigger value="faqs" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            FAQs
          </TabsTrigger>
        </TabsList>

        {/* Videos Tab */}
        <TabsContent value="videos" className="mt-4 space-y-4">
          {tutorialCategories.map((category) => (
            <Card key={category.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", category.color)}>
                    <category.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription className="text-xs">{category.description}</CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {category.videos.length} videos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-2">
                  {category.videos.map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors group"
                      onClick={() => handlePlayVideo(video)}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-10 bg-gradient-to-br from-primary/20 to-primary/40 rounded flex items-center justify-center">
                          <Play className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{video.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{video.description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          {video.duration}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Quick answers to common questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left text-sm">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Video Player Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Video Placeholder */}
            <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-lg flex flex-col items-center justify-center border">
              <PlayCircle className="h-16 w-16 text-primary mb-4" />
              <p className="text-lg font-medium">Video Coming Soon</p>
              <p className="text-sm text-muted-foreground mt-1">
                Duration: {selectedVideo?.duration}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">About this tutorial</h4>
              <p className="text-sm text-muted-foreground">{selectedVideo?.description}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
