import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Heart, Video, UserPlus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TikTokStatsCard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('getTikTokStats');
      if (response.data.success) {
        setStats(response.data.stats);
      } else {
        setError(response.data.error || 'Failed to load stats');
      }
    } catch (err) {
      console.error('Error loading TikTok stats:', err);
      setError('Failed to connect to TikTok');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-[#26847F]" />
            TikTok Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#26847F]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-[#26847F]" />
            TikTok Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Button 
              onClick={loadStats}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Riprova
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-[#26847F]" />
            TikTok Stats
          </CardTitle>
          <Button 
            onClick={loadStats}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </Button>
        </div>
        {stats?.display_name && (
          <p className="text-sm text-gray-600 mt-1">@{stats.display_name}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-white rounded-full">
              <Users className="w-5 h-5 text-[#26847F]" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Followers</p>
              <p className="text-xl font-bold text-gray-900">
                {formatNumber(stats?.follower_count)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-white rounded-full">
              <UserPlus className="w-5 h-5 text-[#26847F]" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Following</p>
              <p className="text-xl font-bold text-gray-900">
                {formatNumber(stats?.following_count)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-white rounded-full">
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Likes</p>
              <p className="text-xl font-bold text-gray-900">
                {formatNumber(stats?.likes_count)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-white rounded-full">
              <Video className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Videos</p>
              <p className="text-xl font-bold text-gray-900">
                {formatNumber(stats?.video_count)}
              </p>
            </div>
          </div>
        </div>

        {stats?.bio_description && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Bio</p>
            <p className="text-sm text-gray-700">{stats.bio_description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}