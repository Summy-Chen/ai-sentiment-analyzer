import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, Plus, X, BarChart3, TrendingUp, TrendingDown, 
  Minus, Loader2, RefreshCw, Scale
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

const COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b"];

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
            <Scale className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold">
            <span className="gradient-text">多产品对比分析</span>
          </span>
        </div>
      </div>
    </header>
  );
}

interface ProductInput {
  id: string;
  name: string;
}

interface AnalysisResult {
  productName: string;
  overallSentiment: string;
  positiveRatio: number;
  negativeRatio: number;
  neutralRatio: number;
  summary: string;
  keyThemes: string[];
  totalCommentsAnalyzed: number;
}

function ProductInputSection({ 
  products, 
  onAdd, 
  onRemove, 
  onChange,
  onCompare,
  isLoading
}: {
  products: ProductInput[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, name: string) => void;
  onCompare: () => void;
  isLoading: boolean;
}) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          选择对比产品
        </CardTitle>
        <CardDescription>
          输入2-3个AI产品名称进行对比分析
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.map((product, index) => (
          <div key={product.id} className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: COLORS[index] }}
            >
              {index + 1}
            </div>
            <Input
              placeholder={`输入第${index + 1}个产品名称，如 ChatGPT`}
              value={product.name}
              onChange={(e) => onChange(product.id, e.target.value)}
              className="flex-1"
            />
            {products.length > 2 && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onRemove(product.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        
        <div className="flex items-center gap-3 pt-2">
          {products.length < 3 && (
            <Button 
              variant="outline" 
              onClick={onAdd}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              添加产品
            </Button>
          )}
          <Button 
            onClick={onCompare}
            disabled={isLoading || products.filter(p => p.name.trim()).length < 2}
            className="gap-2 gradient-bg hover:opacity-90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <Scale className="w-4 h-4" />
                开始对比
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ComparisonOverview({ results }: { results: AnalysisResult[] }) {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "negative": return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
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

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>对比概览</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${results.length}, 1fr)` }}>
          {results.map((result, index) => (
            <div key={result.productName} className="space-y-4 p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <h3 className="font-semibold">{result.productName}</h3>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                {getSentimentIcon(result.overallSentiment)}
                <span>整体评价：{getSentimentLabel(result.overallSentiment)}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-green-600">正面</span>
                  <span>{result.positiveRatio}%</span>
                </div>
                <Progress value={result.positiveRatio} className="h-1.5 [&>div]:bg-green-500" />
                
                <div className="flex justify-between text-xs">
                  <span className="text-red-600">负面</span>
                  <span>{result.negativeRatio}%</span>
                </div>
                <Progress value={result.negativeRatio} className="h-1.5 [&>div]:bg-red-500" />
                
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">中立</span>
                  <span>{result.neutralRatio}%</span>
                </div>
                <Progress value={result.neutralRatio} className="h-1.5 [&>div]:bg-gray-400" />
              </div>
              
              <div className="text-xs text-muted-foreground">
                分析了 {result.totalCommentsAnalyzed} 条评论
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RadarComparisonChart({ results }: { results: AnalysisResult[] }) {
  const radarData = useMemo(() => {
    return [
      {
        metric: "正面评价",
        ...results.reduce((acc, r, i) => ({ ...acc, [`product${i}`]: r.positiveRatio }), {})
      },
      {
        metric: "用户活跃度",
        ...results.reduce((acc, r, i) => ({ ...acc, [`product${i}`]: Math.min(100, r.totalCommentsAnalyzed * 5) }), {})
      },
      {
        metric: "话题热度",
        ...results.reduce((acc, r, i) => ({ ...acc, [`product${i}`]: Math.min(100, r.keyThemes.length * 20) }), {})
      },
      {
        metric: "中立评价",
        ...results.reduce((acc, r, i) => ({ ...acc, [`product${i}`]: r.neutralRatio }), {})
      },
      {
        metric: "负面评价",
        ...results.reduce((acc, r, i) => ({ ...acc, [`product${i}`]: 100 - r.negativeRatio }), {})
      }
    ];
  }, [results]);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>多维度雷达图对比</CardTitle>
        <CardDescription>从多个维度对比产品表现</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              {results.map((result, index) => (
                <Radar
                  key={result.productName}
                  name={result.productName}
                  dataKey={`product${index}`}
                  stroke={COLORS[index]}
                  fill={COLORS[index]}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function BarComparisonChart({ results }: { results: AnalysisResult[] }) {
  const barData = useMemo(() => {
    return results.map((result, index) => ({
      name: result.productName,
      正面: result.positiveRatio,
      负面: result.negativeRatio,
      中立: result.neutralRatio,
      fill: COLORS[index]
    }));
  }, [results]);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>情感分布对比</CardTitle>
        <CardDescription>各产品的情感评价分布</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
              <Tooltip />
              <Legend />
              <Bar dataKey="正面" fill="#22c55e" stackId="a" />
              <Bar dataKey="中立" fill="#9ca3af" stackId="a" />
              <Bar dataKey="负面" fill="#ef4444" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function KeyThemesComparison({ results }: { results: AnalysisResult[] }) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>关键主题对比</CardTitle>
        <CardDescription>各产品讨论的主要话题</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${results.length}, 1fr)` }}>
          {results.map((result, index) => (
            <div key={result.productName} className="space-y-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <h4 className="font-medium">{result.productName}</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.keyThemes.map((theme, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary"
                    className="text-xs"
                    style={{ 
                      backgroundColor: `${COLORS[index]}20`,
                      color: COLORS[index],
                      borderColor: COLORS[index]
                    }}
                  >
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryComparison({ results }: { results: AnalysisResult[] }) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>分析总结</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {results.map((result, index) => (
            <div key={result.productName} className="space-y-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <h4 className="font-medium">{result.productName}</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-5">
                {result.summary}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Compare() {
  const [products, setProducts] = useState<ProductInput[]>([
    { id: "1", name: "" },
    { id: "2", name: "" }
  ]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const addProduct = () => {
    if (products.length < 3) {
      setProducts([...products, { id: Date.now().toString(), name: "" }]);
    }
  };

  const removeProduct = (id: string) => {
    if (products.length > 2) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const updateProduct = (id: string, name: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, name } : p));
  };

  const handleCompare = async () => {
    const validProducts = products.filter(p => p.name.trim());
    if (validProducts.length < 2) {
      setError("请至少输入2个产品名称");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      // Fetch analysis for each product in parallel
      const analysisPromises = validProducts.map(async (product) => {
        const result = await utils.client.analysis.analyze.query({
          productName: product.name.trim()
        });
        return result as AnalysisResult;
      });

      const analysisResults = await Promise.all(analysisPromises);
      setResults(analysisResults);
    } catch (err: any) {
      setError(err.message || "分析失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <ProductInputSection
            products={products}
            onAdd={addProduct}
            onRemove={removeProduct}
            onChange={updateProduct}
            onCompare={handleCompare}
            isLoading={isLoading}
          />

          {error && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="py-4">
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <h3 className="text-lg font-medium mb-2">正在分析中...</h3>
              <p className="text-muted-foreground text-center">
                正在并行分析 {products.filter(p => p.name.trim()).length} 个产品的舆情数据
              </p>
            </div>
          )}

          {results.length >= 2 && (
            <>
              <ComparisonOverview results={results} />
              
              <div className="grid lg:grid-cols-2 gap-6">
                <RadarComparisonChart results={results} />
                <BarComparisonChart results={results} />
              </div>
              
              <KeyThemesComparison results={results} />
              <SummaryComparison results={results} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
