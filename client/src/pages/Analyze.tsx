import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { 
  Search, ArrowLeft, TrendingUp, TrendingDown, Minus, 
  ThumbsUp, ThumbsDown, MessageSquare, Download, Bell,
  BarChart3, User, ExternalLink, Loader2, RefreshCw, LineChart
} from "lucide-react";
import { SentimentTrendChart, SourceBreakdownChart } from "@/components/SentimentTrendChart";
import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

function Header({ productName }: { productName: string }) {
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
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold">
            <span className="gradient-text">{productName}</span> 舆情分析
          </span>
        </div>
      </div>
    </header>
  );
}

function SentimentOverview({ data }: { data: any }) {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return <TrendingUp className="w-5 h-5 text-green-500" />;
      case "negative": return <TrendingDown className="w-5 h-5 text-red-500" />;
      case "mixed": return <Minus className="w-5 h-5 text-yellow-500" />;
      default: return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "正面";
      case "negative": return "负面";
      case "mixed": return "混合";
      default: return "中立";
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "bg-green-500";
      case "negative": return "bg-red-500";
      case "mixed": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getSentimentIcon(data.overallSentiment)}
          整体评价：{getSentimentLabel(data.overallSentiment)}
        </CardTitle>
        <CardDescription>
          基于 {data.totalCommentsAnalyzed} 条评论分析 · 来源：{data.sources?.join("、")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-green-500" />
                正面评价
              </span>
              <span className="font-medium">{data.positiveRatio}%</span>
            </div>
            <Progress value={data.positiveRatio} className="h-2 bg-muted [&>div]:bg-green-500" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <ThumbsDown className="w-4 h-4 text-red-500" />
                负面评价
              </span>
              <span className="font-medium">{data.negativeRatio}%</span>
            </div>
            <Progress value={data.negativeRatio} className="h-2 bg-muted [&>div]:bg-red-500" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-gray-500" />
                中立评价
              </span>
              <span className="font-medium">{data.neutralRatio}%</span>
            </div>
            <Progress value={data.neutralRatio} className="h-2 bg-muted [&>div]:bg-gray-400" />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-3">关键主题</h4>
          <div className="flex flex-wrap gap-2">
            {data.keyThemes?.map((theme: string, index: number) => (
              <Badge key={index} variant="secondary" className="bg-accent text-accent-foreground">
                {theme}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummarySection({ summary }: { summary: string }) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          智能总结
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none text-foreground">
          <Streamdown>{summary}</Streamdown>
        </div>
      </CardContent>
    </Card>
  );
}

function CommentCard({ comment, type }: { comment: { text: string; source: string; author?: string }; type: "positive" | "negative" | "neutral" }) {
  const getTypeStyles = () => {
    switch (type) {
      case "positive": return "border-l-green-500";
      case "negative": return "border-l-red-500";
      default: return "border-l-gray-400";
    }
  };

  return (
    <div className={`p-4 bg-muted/30 rounded-lg border-l-4 ${getTypeStyles()}`}>
      <p className="text-sm leading-relaxed mb-2">{comment.text}</p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {comment.author && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {comment.author}
          </span>
        )}
        <span className="flex items-center gap-1">
          <ExternalLink className="w-3 h-3" />
          {comment.source}
        </span>
      </div>
    </div>
  );
}

function CommentsSection({ data }: { data: any }) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>代表性评语</CardTitle>
        <CardDescription>精选具有代表性的用户评价</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="positive" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="positive" className="gap-1">
              <ThumbsUp className="w-4 h-4" />
              正面 ({data.positiveComments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="negative" className="gap-1">
              <ThumbsDown className="w-4 h-4" />
              负面 ({data.negativeComments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="neutral" className="gap-1">
              <Minus className="w-4 h-4" />
              中立 ({data.neutralComments?.length || 0})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="positive">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {data.positiveComments?.map((comment: any, index: number) => (
                  <CommentCard key={index} comment={comment} type="positive" />
                ))}
                {(!data.positiveComments || data.positiveComments.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">暂无正面评价</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="negative">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {data.negativeComments?.map((comment: any, index: number) => (
                  <CommentCard key={index} comment={comment} type="negative" />
                ))}
                {(!data.negativeComments || data.negativeComments.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">暂无负面评价</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="neutral">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {data.neutralComments?.map((comment: any, index: number) => (
                  <CommentCard key={index} comment={comment} type="neutral" />
                ))}
                {(!data.neutralComments || data.neutralComments.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">暂无中立评价</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ActionButtons({ data, productName }: { data: any; productName: string }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  
  const exportMutation = trpc.analysis.exportReport.useMutation({
    onSuccess: (result) => {
      // Create download link
      const blob = new Blob([result.content], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("报告导出成功");
    },
    onError: (err) => {
      toast.error("导出失败：" + err.message);
    }
  });

  const createMonitorMutation = trpc.monitor.create.useMutation({
    onSuccess: () => {
      toast.success("监控任务创建成功");
    },
    onError: (err) => {
      toast.error("创建失败：" + err.message);
    }
  });

  const handleExport = (format: "pdf" | "text") => {
    if (data?.id) {
      exportMutation.mutate({ analysisId: data.id, format });
    }
  };

  const handleCreateMonitor = () => {
    createMonitorMutation.mutate({ productName });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Button 
        variant="outline" 
        className="gap-2"
        onClick={() => handleExport("text")}
        disabled={exportMutation.isPending || !data?.id}
      >
        <Download className="w-4 h-4" />
        导出文本
      </Button>
      <Button 
        variant="outline" 
        className="gap-2"
        onClick={() => handleExport("pdf")}
        disabled={exportMutation.isPending || !data?.id}
      >
        <Download className="w-4 h-4" />
        导出PDF
      </Button>
      {isAuthenticated && (
        <Button 
          className="gap-2 gradient-bg hover:opacity-90"
          onClick={handleCreateMonitor}
          disabled={createMonitorMutation.isPending}
        >
          <Bell className="w-4 h-4" />
          设置监控
        </Button>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
      <h3 className="text-lg font-medium mb-2">正在分析中...</h3>
      <p className="text-muted-foreground text-center max-w-md">
        正在搜索社交媒体评价并进行AI智能分析，这可能需要一些时间
      </p>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <TrendingDown className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-medium mb-2">分析失败</h3>
      <p className="text-muted-foreground text-center max-w-md mb-4">{error}</p>
      <Button onClick={onRetry} className="gap-2">
        <RefreshCw className="w-4 h-4" />
        重试
      </Button>
    </div>
  );
}

export default function Analyze() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const productName = params.get("product") || "";
  
  const [searchInput, setSearchInput] = useState(productName);
  
  const { data, isLoading, error, refetch } = trpc.analysis.analyze.useQuery(
    { productName },
    { 
      enabled: !!productName,
      retry: false,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );

  const handleSearch = () => {
    if (searchInput.trim() && searchInput !== productName) {
      window.location.href = `/analyze?product=${encodeURIComponent(searchInput.trim())}`;
    }
  };

  if (!productName) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header productName="未指定产品" />
        <main className="flex-1 container py-8">
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">请输入要分析的AI产品名称</p>
            <Link href="/">
              <Button>返回首页</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header productName={productName} />
      
      <main className="flex-1 container py-8">
        {/* Search bar */}
        <div className="flex gap-3 mb-8">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="搜索其他AI产品..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-12 h-12 rounded-xl"
            />
          </div>
          <Button 
            onClick={handleSearch}
            disabled={!searchInput.trim() || searchInput === productName}
            className="h-12 px-6 rounded-xl gradient-bg hover:opacity-90"
          >
            分析
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error.message} onRetry={() => refetch()} />
        ) : data ? (
          <div className="space-y-6">
            {/* Action buttons */}
            <div className="flex justify-end">
              <ActionButtons data={data} productName={productName} />
            </div>
            
            {/* Main content grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <SentimentOverview data={data} />
                {data.sourceBreakdown && (
                  <SourceBreakdownChart sourceBreakdown={data.sourceBreakdown} />
                )}
              </div>
              <div className="lg:col-span-2 space-y-6">
                <SummarySection summary={data.summary} />
                <SentimentTrendChart productName={productName} />
                <CommentsSection data={data} />
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
