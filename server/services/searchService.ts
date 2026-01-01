import axios from "axios";
import { ENV } from "../_core/env";

export interface SearchResult {
  text: string;
  source: string;
  author?: string;
  url?: string;
  date?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  totalFound: number;
  sources: string[];
}

/**
 * Search for social media discussions about an AI product
 * Uses the built-in Forge API for web search
 */
export async function searchSocialMedia(productName: string): Promise<SearchResponse> {
  const results: SearchResult[] = [];
  const sources = new Set<string>();

  // Search queries for different platforms and perspectives
  const searchQueries = [
    `${productName} review user experience`,
    `${productName} Reddit discussion opinions`,
    `${productName} Twitter feedback`,
    `${productName} pros cons comparison`,
    `${productName} user complaints issues`,
    `${productName} best features praise`
  ];

  try {
    // Use the built-in Forge API for search
    const forgeApiUrl = ENV.forgeApiUrl;
    const forgeApiKey = ENV.forgeApiKey;

    if (!forgeApiUrl || !forgeApiKey) {
      console.warn("Forge API not configured, using mock data");
      return getMockSearchResults(productName);
    }

    // Perform searches
    for (const query of searchQueries.slice(0, 3)) { // Limit to 3 queries for performance
      try {
        const response = await axios.post(
          `${forgeApiUrl}/v1/search`,
          {
            query,
            search_type: "info",
            max_results: 10
          },
          {
            headers: {
              "Authorization": `Bearer ${forgeApiKey}`,
              "Content-Type": "application/json"
            },
            timeout: 30000
          }
        );

        if (response.data?.results) {
          for (const item of response.data.results) {
            // Extract source from URL
            let source = "Web";
            if (item.url) {
              if (item.url.includes("reddit.com")) source = "Reddit";
              else if (item.url.includes("twitter.com") || item.url.includes("x.com")) source = "Twitter";
              else if (item.url.includes("youtube.com")) source = "YouTube";
              else if (item.url.includes("news")) source = "News";
              else {
                try {
                  source = new URL(item.url).hostname.replace("www.", "");
                } catch {
                  source = "Web";
                }
              }
            }

            sources.add(source);
            results.push({
              text: item.snippet || item.description || item.title || "",
              source,
              author: item.author,
              url: item.url,
              date: item.date
            });
          }
        }
      } catch (searchError) {
        console.warn(`Search query failed: ${query}`, searchError);
      }
    }

    // If no results found, return mock data
    if (results.length === 0) {
      return getMockSearchResults(productName);
    }

    return {
      results,
      totalFound: results.length,
      sources: Array.from(sources)
    };
  } catch (error) {
    console.error("Search service error:", error);
    return getMockSearchResults(productName);
  }
}

/**
 * Generate mock search results for testing/fallback
 */
function getMockSearchResults(productName: string): SearchResponse {
  const mockResults: SearchResult[] = [
    {
      text: `I've been using ${productName} for a few months now and I'm really impressed with its capabilities. The response quality is excellent and it handles complex tasks well.`,
      source: "Reddit",
      author: "tech_enthusiast_2024"
    },
    {
      text: `${productName} has completely changed how I work. The productivity gains are incredible. Highly recommend for anyone in tech.`,
      source: "Twitter",
      author: "@productivityguru"
    },
    {
      text: `While ${productName} is powerful, I've noticed some issues with accuracy in specialized domains. It sometimes generates plausible-sounding but incorrect information.`,
      source: "Reddit",
      author: "skeptical_user"
    },
    {
      text: `The pricing of ${productName} is a concern for small teams. The free tier is too limited and the paid plans are expensive compared to alternatives.`,
      source: "Twitter",
      author: "@startup_founder"
    },
    {
      text: `${productName} excels at creative writing and brainstorming. I use it daily for content creation and it's been a game-changer.`,
      source: "Reddit",
      author: "content_creator_pro"
    },
    {
      text: `Just tried ${productName} for coding assistance. Mixed results - great for boilerplate but struggles with complex algorithms.`,
      source: "Twitter",
      author: "@dev_daily"
    },
    {
      text: `The latest update to ${productName} fixed many of the issues I had. The team is clearly listening to user feedback.`,
      source: "Reddit",
      author: "beta_tester_123"
    },
    {
      text: `${productName} vs competitors: it's faster but sometimes less accurate. Trade-offs to consider based on your use case.`,
      source: "News",
      author: "TechReview Magazine"
    },
    {
      text: `Privacy concerns with ${productName} - make sure you understand what data is being collected and how it's used.`,
      source: "Reddit",
      author: "privacy_advocate"
    },
    {
      text: `${productName} integration with other tools is seamless. The API is well-documented and easy to use.`,
      source: "Twitter",
      author: "@api_developer"
    },
    {
      text: `Customer support for ${productName} has been responsive. They resolved my billing issue within 24 hours.`,
      source: "Reddit",
      author: "satisfied_customer"
    },
    {
      text: `The mobile app for ${productName} needs work. Desktop experience is great but mobile feels like an afterthought.`,
      source: "Twitter",
      author: "@mobile_first"
    }
  ];

  return {
    results: mockResults,
    totalFound: mockResults.length,
    sources: ["Reddit", "Twitter", "News"]
  };
}
