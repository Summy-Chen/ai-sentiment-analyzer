import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Cloud } from "lucide-react";

interface WordCloudProps {
  keywords: string[];
  comments?: Array<{ text: string; source: string; author?: string }>;
  className?: string;
}

interface WordData {
  text: string;
  count: number;
  size: number;
  color: string;
}

// Color palette for word cloud
const COLORS = [
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ec4899", // pink
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#f97316", // orange
];

export function WordCloud({ keywords, comments = [], className }: WordCloudProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Process keywords to get word data with counts
  const wordData = useMemo(() => {
    // Count keyword occurrences
    const wordCounts = new Map<string, number>();
    
    keywords.forEach(keyword => {
      const normalized = keyword.toLowerCase().trim();
      if (normalized.length > 1) {
        wordCounts.set(normalized, (wordCounts.get(normalized) || 0) + 1);
      }
    });

    // Also extract words from comments for additional context
    const stopWords = new Set([
      "的", "是", "在", "了", "和", "与", "或", "但", "而", "也", "都", "就", "有", "这", "那",
      "the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
      "do", "does", "did", "will", "would", "could", "should", "may", "might", "must", "shall",
      "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into", "through",
      "it", "its", "this", "that", "these", "those", "i", "you", "he", "she", "we", "they",
      "and", "or", "but", "if", "so", "not", "no", "yes", "can", "very", "just", "more"
    ]);

    comments.forEach(comment => {
      // Extract words from comment text
      const words = comment.text
        .toLowerCase()
        .replace(/[^\w\s\u4e00-\u9fa5]/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));
      
      words.forEach(word => {
        if (word.length > 2) {
          wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        }
      });
    });

    // Sort by count and take top words
    const sortedWords = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);

    if (sortedWords.length === 0) return [];

    const maxCount = sortedWords[0][1];
    const minCount = sortedWords[sortedWords.length - 1][1];
    const range = maxCount - minCount || 1;

    return sortedWords.map(([text, count], index) => {
      // Calculate size based on count (14px to 36px)
      const normalizedCount = (count - minCount) / range;
      const size = 14 + normalizedCount * 22;
      
      return {
        text,
        count,
        size,
        color: COLORS[index % COLORS.length]
      };
    });
  }, [keywords, comments]);

  // Find comments containing the selected word
  const relatedComments = useMemo(() => {
    if (!selectedWord) return [];
    
    return comments.filter(comment => 
      comment.text.toLowerCase().includes(selectedWord.toLowerCase())
    ).slice(0, 10);
  }, [selectedWord, comments]);

  const handleWordClick = (word: string) => {
    setSelectedWord(word);
    setDialogOpen(true);
  };

  if (wordData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            关键词云
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground">
          <p>暂无足够的关键词数据</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            关键词云
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-center items-center gap-3 py-4 min-h-[200px]">
            {wordData.map((word, index) => (
              <button
                key={`${word.text}-${index}`}
                onClick={() => handleWordClick(word.text)}
                className="transition-all duration-200 hover:scale-110 hover:opacity-80 cursor-pointer"
                style={{
                  fontSize: `${word.size}px`,
                  color: word.color,
                  fontWeight: word.size > 24 ? 600 : 400,
                  lineHeight: 1.2
                }}
                title={`${word.text}: ${word.count}次`}
              >
                {word.text}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            点击关键词查看相关评论
          </p>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              包含 "<span className="text-primary">{selectedWord}</span>" 的评论
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {relatedComments.length > 0 ? (
              <div className="space-y-3 pr-4">
                {relatedComments.map((comment, index) => (
                  <div 
                    key={index} 
                    className="p-3 bg-muted/50 rounded-lg border-l-2 border-primary/50"
                  >
                    <p className="text-sm leading-relaxed mb-2">
                      {highlightWord(comment.text, selectedWord || "")}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {comment.author && <span>{comment.author}</span>}
                      <span>· {comment.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                未找到包含该关键词的评论
              </p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper function to highlight the keyword in text
function highlightWord(text: string, word: string): React.ReactNode {
  if (!word) return text;
  
  const regex = new RegExp(`(${word})`, "gi");
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    part.toLowerCase() === word.toLowerCase() ? (
      <span key={index} className="bg-primary/20 text-primary font-medium px-0.5 rounded">
        {part}
      </span>
    ) : (
      part
    )
  );
}

// Compact version for smaller spaces
export function WordCloudCompact({ keywords, className }: { keywords: string[]; className?: string }) {
  // Get unique keywords and limit to top 10
  const topKeywords = useMemo(() => {
    const counts = new Map<string, number>();
    keywords.forEach(k => {
      const normalized = k.toLowerCase().trim();
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
    });
    
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([text]) => text);
  }, [keywords]);

  if (topKeywords.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {topKeywords.map((keyword, index) => (
        <Badge 
          key={index} 
          variant="secondary"
          className="text-xs"
          style={{
            backgroundColor: `${COLORS[index % COLORS.length]}15`,
            color: COLORS[index % COLORS.length],
            borderColor: COLORS[index % COLORS.length]
          }}
        >
          {keyword}
        </Badge>
      ))}
    </div>
  );
}
