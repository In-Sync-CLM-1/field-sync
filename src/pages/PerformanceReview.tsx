import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrgPerformance, useDailyTrends } from '@/hooks/usePerformanceReview';
import { OrgOverviewTab } from '@/components/performance/OrgOverviewTab';
import { BranchDrilldownTab } from '@/components/performance/BranchDrilldownTab';
import { MapViewTab } from '@/components/performance/MapViewTab';
import { AIInsightsTab } from '@/components/performance/AIInsightsTab';
import { Building2, Users, Map, Sparkles } from 'lucide-react';

export default function PerformanceReview() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const { data: orgData, isLoading: orgLoading } = useOrgPerformance();
  const { data: dailyTrends } = useDailyTrends();

  const handleBranchClick = (branchId: string) => {
    setSelectedBranchId(branchId);
    setActiveTab('branch');
  };

  return (
    <div className="p-3 md:p-4 space-y-4 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground">Performance Review</h1>
        <p className="text-xs text-muted-foreground">Organization → Branch → Employee drill-down</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-8">
          <TabsTrigger value="overview" className="text-xs px-3 py-1 flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="branch" className="text-xs px-3 py-1 flex items-center gap-1">
            <Users className="h-3 w-3" />
            Branch
          </TabsTrigger>
          <TabsTrigger value="map" className="text-xs px-3 py-1 flex items-center gap-1">
            <Map className="h-3 w-3" />
            Map
          </TabsTrigger>
          <TabsTrigger value="insights" className="text-xs px-3 py-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OrgOverviewTab
            data={orgData}
            isLoading={orgLoading}
            dailyTrends={dailyTrends}
            onBranchClick={handleBranchClick}
          />
        </TabsContent>

        <TabsContent value="branch">
          <BranchDrilldownTab
            branches={orgData?.branches || []}
            selectedBranchId={selectedBranchId}
            onBranchChange={setSelectedBranchId}
          />
        </TabsContent>

        <TabsContent value="map">
          <MapViewTab branches={orgData?.branches || []} />
        </TabsContent>

        <TabsContent value="insights">
          <AIInsightsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
