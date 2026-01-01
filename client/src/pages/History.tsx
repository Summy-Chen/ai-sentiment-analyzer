import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, BarChart3, Search, TrendingUp, TrendingDown, 
  Minus, Calendar, ExternalLink, Loader2, History as HistoryIcon
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";

function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="container flex items-center gap-4 h-16">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <HistoryIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold gradient-text">历史记录</span>
        </div>
      </div>
    </header>
  );
}

function getSentimentIcon(sentiment: string) {
  switch (sentiment) {
    case "positive": return <TrendingUp className="w-4 h-4 text-green-500" />;
    case "negative": return <TrendingDown className="w-4 h-4 text-red-500" />;
    case "mixed": return <Minus className="w-4 h-4 text-yellow-500" />;
    default: return <Minus className="w-4 h-4 text-gray-500" />;
  }
}

function getSentimentLabel(sentiment: string) {
  switch (sentiment) {
    case "positive": return "正面";
    case "negative": return "负面";
    case "mixed": return "混合";
    default: return "中立";
  }
}

function getSentimentBadgeVariant(sentiment: string): "default" | "secondary" | "destructive" | "outline" {
  switch (sentiment) {
    case "positive": return "default";
    case "negative": return "destructive";
    default: return "secondary";
  }
}

function HistoryCard({ record }: { record: any }) {
  const [, setLocation] = useLocation();
  
  return (
    <Card className="card-hover border-border/50 cursor-pointer" onClick={() => setLocation(`/analyze?product=${encodeURIComponent(record.productName)}`)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{record.productName}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Calendar className="w-3 h-3" />
              {new Date(record.createdAt).toLocaleString("zh-CN")}
            </CardDescription>
          </div>
          <Badge variant={getSentimentBadgeVariant(record.overallSentiment)} className="flex items-center gap-1">
            {getSentimentIcon(record.overallSentiment)}
            {getSentimentLabel(record.overallSentiment)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-500" />
            {record.positiveRatio}%
          </span>
          <span className="flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-red-500" />
            {record.negativeRatio}%
          </span>
          <span className="flex items-center gap-1">
            <Minus className="w-3 h-3 text-gray-400" />
            {record.neutralRatio}%
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {record.summary}
        </p>
        <div className="flex flex-wrap gap-1 mt-3">
          {record.keyThemes?.slice(0, 3).map((theme: string, index: number) => (
            <Badge key={index} variant="outline" className="text-xs">
              {theme}
            </Badge>
          ))}
          {record.keyThemes?.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{record.keyThemes.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <HistoryIcon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">暂无历史记录</h3>
      <p className="text-muted-foreground text-center max-w-md mb-4">
        开始分析AI产品后，您的分析记录将显示在这里
      </p>
      <Link href="/">
        <Button className="gradient-bg hover:opacity-90">开始分析</Button>
      </Link>
    </div>
  );
}

function LoginPrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <HistoryIcon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">请先登录</h3>
      <p className="text-muted-foreground text-center max-w-md mb-4">
        登录后可以查看和管理您的分析历史记录
      </p>
      <Button asChild className="gradient-bg hover:opacity-90">
        <a href={getLoginUrl()}>登录</a>
      </Button>
    </div>
  );
}

export default function History() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: records, isLoading } = trpc.analysis.history.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const filteredRecords = records?.filter((record: any) =>
    record.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-8">
          <LoginPrompt />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="搜索产品名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !filteredRecords || filteredRecords.length === 0 ? (
          searchQuery ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">未找到匹配的记录</p>
            </div>
          ) : (
            <EmptyState />
          )
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecords.map((record: any) => (
              <HistoryCard key={record.id} record={record} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
