import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Calendar } from "lucide-react";

interface SentimentTrendChartProps {
  productName: string;
  className?: string;
}

type TimeRange = "7d" | "30d" | "90d" | "all";

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string; days: number | null }[] = [
  { value: "7d", label: "近7天", days: 7 },
  { value: "30d", label: "近30天", days: 30 },
  { value: "90d", label: "近90天", days: 90 },
  { value: "all", label: "全部", days: null }
];

export function SentimentTrendChart({ productName, className }: SentimentTrendChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  
  const selectedOption = TIME_RANGE_OPTIONS.find(opt => opt.value === timeRange);
  const limit = selectedOption?.days || 365;

  const { data: trends, isLoading } = trpc.trend.getByProduct.useQuery(
    { productName, limit },
    { enabled: !!productName }
  );

  const chartData = useMemo(() => {
    if (!trends || trends.length === 0) return [];

    // Filter by time range
    const now = new Date();
    const filteredTrends = trends.filter(trend => {
      if (timeRange === "all") return true;
      const trendDate = new Date(trend.recordedAt);
      const daysDiff = Math.floor((now.getTime() - trendDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysLimit = TIME_RANGE_OPTIONS.find(opt => opt.value === timeRange)?.days || 365;
      return daysDiff <= daysLimit;
    });

    return filteredTrends.map((trend) => ({
      date: new Date(trend.recordedAt).toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric"
      }),
      fullDate: new Date(trend.recordedAt).toLocaleDateString("zh-CN"),
      positive: trend.positiveRatio,
      negative: trend.negativeRatio,
      neutral: trend.neutralRatio,
      overall: trend.overallScore,
      twitter: trend.twitterCount,
      reddit: trend.redditCount,
      other: trend.otherCount,
      total: trend.totalCount
    }));
  }, [trends, timeRange]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">情感趋势</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">情感趋势</CardTitle>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <p>暂无趋势数据，多次分析后将显示趋势图表</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          情感趋势变化
        </CardTitle>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    positive: "正面评价",
                    negative: "负面评价",
                    neutral: "中立评价"
                  };
                  return [`${value}%`, labels[name] || name];
                }}
                labelFormatter={(label) => `日期: ${label}`}
              />
              <Legend
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    positive: "正面",
                    negative: "负面",
                    neutral: "中立"
                  };
                  return labels[value] || value;
                }}
              />
              <Area
                type="monotone"
                dataKey="positive"
                stroke="#22c55e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPositive)"
              />
              <Area
                type="monotone"
                dataKey="negative"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNegative)"
              />
              <Area
                type="monotone"
                dataKey="neutral"
                stroke="#6b7280"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNeutral)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-xs text-muted-foreground text-center">
          显示 {chartData.length} 条趋势记录
        </div>
      </CardContent>
    </Card>
  );
}

function TimeRangeSelector({ 
  value, 
  onChange 
}: { 
  value: TimeRange; 
  onChange: (value: TimeRange) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
      {TIME_RANGE_OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "ghost"}
          size="sm"
          className={`h-7 px-3 text-xs ${
            value === option.value 
              ? "gradient-bg text-white shadow-sm" 
              : "hover:bg-muted"
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

interface SourceBreakdownChartProps {
  sourceBreakdown: {
    twitter: number;
    reddit: number;
    news: number;
    web: number;
  };
  className?: string;
}

export function SourceBreakdownChart({ sourceBreakdown, className }: SourceBreakdownChartProps) {
  const data = [
    { name: "Twitter", value: sourceBreakdown.twitter, color: "#1DA1F2" },
    { name: "Reddit", value: sourceBreakdown.reddit, color: "#FF4500" },
    { name: "新闻", value: sourceBreakdown.news, color: "#6366f1" },
    { name: "网页", value: sourceBreakdown.web, color: "#8b5cf6" }
  ].filter(item => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">数据来源分布</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.name} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">
                  {item.value} 条 ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${total > 0 ? (item.value / total) * 100 : 0}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <p className="text-center text-muted-foreground py-4">暂无数据来源信息</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
