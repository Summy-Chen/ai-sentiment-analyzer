import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Search, TrendingUp, MessageSquare, BarChart3, History, Bell, LogOut, User } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

function FloatingDecorations() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating gradient lines */}
      <div className="floating-line w-64 top-20 left-10 rotate-[-5deg] opacity-60" />
      <div className="floating-line w-48 top-40 right-20 rotate-[8deg] opacity-40" />
      <div className="floating-line w-80 bottom-32 left-1/4 rotate-[-3deg] opacity-50" />
      <div className="floating-line w-56 top-1/3 right-1/3 rotate-[12deg] opacity-30" />
      
      {/* Floating circles */}
      <div className="floating-circle w-96 h-96 -top-20 -right-20 opacity-60" />
      <div className="floating-circle w-64 h-64 top-1/2 -left-20 opacity-40" />
      <div className="floating-circle w-48 h-48 bottom-20 right-1/4 opacity-50" />
    </div>
  );
}

function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">AI舆情分析</span>
        </Link>
        
        <nav className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link href="/history" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <History className="w-4 h-4" />
                历史记录
              </Link>
              <Link href="/monitors" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <Bell className="w-4 h-4" />
                监控任务
              </Link>
              <div className="flex items-center gap-3 pl-4 border-l border-border">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {user?.name || "用户"}
                </span>
                <Button variant="ghost" size="sm" onClick={() => logout()}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <Button asChild className="gradient-bg hover:opacity-90">
              <a href={getLoginUrl()}>登录</a>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

function HeroSection() {
  const [productName, setProductName] = useState("");
  const { isAuthenticated } = useAuth();

  const handleAnalyze = () => {
    if (productName.trim()) {
      window.location.href = `/analyze?product=${encodeURIComponent(productName.trim())}`;
    }
  };

  return (
    <section className="relative py-24 lg:py-32">
      <div className="container text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
          <span className="gradient-text">AI产品舆情分析</span>
          <br />
          <span className="text-foreground">洞察全球用户声音</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          输入任意AI产品名称，快速获取社交媒体上的真实用户评价、
          情感分析报告和舆论趋势洞察
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="输入AI产品名称，如 ChatGPT、Claude、Midjourney..."
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              className="pl-12 h-14 text-base rounded-xl border-border/60 focus:border-primary"
            />
          </div>
          <Button 
            onClick={handleAnalyze}
            disabled={!productName.trim()}
            className="h-14 px-8 text-base rounded-xl gradient-bg hover:opacity-90 transition-opacity"
          >
            开始分析
          </Button>
        </div>
        
        {!isAuthenticated && (
          <p className="mt-4 text-sm text-muted-foreground">
            <a href={getLoginUrl()} className="text-primary hover:underline">登录</a>
            后可保存分析记录和设置监控任务
          </p>
        )}
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Search,
      title: "多平台搜索",
      description: "自动搜索Twitter、Reddit等主流社交媒体平台上的用户评价和讨论"
    },
    {
      icon: TrendingUp,
      title: "情感分析",
      description: "AI智能分析评价情感倾向，展示正面、负面、中立评价比例"
    },
    {
      icon: MessageSquare,
      title: "代表性评语",
      description: "精选具有代表性的用户评语，快速了解主流观点"
    },
    {
      icon: BarChart3,
      title: "趋势洞察",
      description: "识别关键讨论主题，把握舆论趋势和热点话题"
    },
    {
      icon: History,
      title: "历史记录",
      description: "保存所有分析记录，随时回顾和对比不同时期的舆情变化"
    },
    {
      icon: Bell,
      title: "定期监控",
      description: "设置自动监控任务，当舆情发生重大变化时及时通知"
    }
  ];

  return (
    <section className="relative py-20 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            <span className="gradient-text">强大功能</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            全方位的AI产品舆情分析能力，助你快速掌握市场动态
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="card-hover border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl gradient-bg/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative py-8 border-t border-border/50">
      <div className="container text-center text-sm text-muted-foreground">
        <p>AI产品舆情分析工具 · 洞察全球用户声音</p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <FloatingDecorations />
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
