import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, Bell, Calendar, Loader2, Trash2, 
  Mail, BellRing, Settings, AlertTriangle
} from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

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
            <Bell className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold gradient-text">监控任务</span>
        </div>
      </div>
    </header>
  );
}

function getFrequencyLabel(frequency: string) {
  switch (frequency) {
    case "daily": return "每日";
    case "weekly": return "每周";
    case "monthly": return "每月";
    default: return frequency;
  }
}

function MonitorCard({ monitor, onUpdate, onDelete }: { 
  monitor: any; 
  onUpdate: (id: number, data: any) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{monitor.productName}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Calendar className="w-3 h-3" />
              创建于 {new Date(monitor.createdAt).toLocaleDateString("zh-CN")}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={monitor.isActive ? "default" : "secondary"}>
              {monitor.isActive ? "运行中" : "已暂停"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Settings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-2">
              <Settings className="w-4 h-4 text-muted-foreground" />
              监控频率
            </span>
            <Select 
              value={monitor.frequency} 
              onValueChange={(value) => onUpdate(monitor.id, { frequency: value })}
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">每日</SelectItem>
                <SelectItem value="weekly">每周</SelectItem>
                <SelectItem value="monthly">每月</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              变化阈值
            </span>
            <Select 
              value={String(monitor.significantChangeThreshold)} 
              onValueChange={(value) => onUpdate(monitor.id, { significantChangeThreshold: parseInt(value) })}
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10%</SelectItem>
                <SelectItem value="20">20%</SelectItem>
                <SelectItem value="30">30%</SelectItem>
                <SelectItem value="50">50%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-2">
              <BellRing className="w-4 h-4 text-muted-foreground" />
              应用内通知
            </span>
            <Switch 
              checked={monitor.notifyInApp}
              onCheckedChange={(checked) => onUpdate(monitor.id, { notifyInApp: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              邮件通知
            </span>
            <Switch 
              checked={monitor.notifyEmail}
              onCheckedChange={(checked) => onUpdate(monitor.id, { notifyEmail: checked })}
            />
          </div>
        </div>

        {/* Last analysis info */}
        {monitor.lastAnalyzedAt && (
          <div className="pt-3 border-t border-border/50 text-sm text-muted-foreground">
            上次分析：{new Date(monitor.lastAnalyzedAt).toLocaleString("zh-CN")}
            {monitor.lastSentimentScore !== null && (
              <span className="ml-2">· 情感得分：{monitor.lastSentimentScore}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <Switch 
            checked={monitor.isActive}
            onCheckedChange={(checked) => onUpdate(monitor.id, { isActive: checked })}
          />
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(monitor.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Bell className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">暂无监控任务</h3>
      <p className="text-muted-foreground text-center max-w-md mb-4">
        在分析结果页面点击"设置监控"按钮，即可创建自动监控任务
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
        <Bell className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">请先登录</h3>
      <p className="text-muted-foreground text-center max-w-md mb-4">
        登录后可以创建和管理监控任务
      </p>
      <Button asChild className="gradient-bg hover:opacity-90">
        <a href={getLoginUrl()}>登录</a>
      </Button>
    </div>
  );
}

export default function Monitors() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  
  const { data: monitors, isLoading } = trpc.monitor.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const updateMutation = trpc.monitor.update.useMutation({
    onSuccess: () => {
      utils.monitor.list.invalidate();
      toast.success("更新成功");
    },
    onError: (error) => {
      toast.error("更新失败：" + error.message);
    }
  });

  const deleteMutation = trpc.monitor.delete.useMutation({
    onSuccess: () => {
      utils.monitor.list.invalidate();
      toast.success("删除成功");
    },
    onError: (error) => {
      toast.error("删除失败：" + error.message);
    }
  });

  const handleUpdate = (id: number, data: any) => {
    updateMutation.mutate({ id, ...data });
  };

  const handleDelete = (id: number) => {
    if (confirm("确定要删除这个监控任务吗？")) {
      deleteMutation.mutate({ id });
    }
  };

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
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">我的监控任务</h2>
          <p className="text-muted-foreground">
            管理您的AI产品舆情监控任务，当舆情发生重大变化时将收到通知
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !monitors || monitors.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {monitors.map((monitor: any) => (
              <MonitorCard 
                key={monitor.id} 
                monitor={monitor}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
