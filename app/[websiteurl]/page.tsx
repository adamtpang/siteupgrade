"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ScoreCircle } from '@/components/grade-cards/ScoreCircle';
import { CategoryCard } from '@/components/grade-cards/CategoryCard';
import { ImprovementsList } from '@/components/grade-cards/ImprovementsList';
import { UpgradePromptCard } from '@/components/grade-cards/UpgradePromptCard';

interface WebsiteData {
  results?: any[];
}

interface LinkedInData {
  results?: any[];
}

interface CategoryData {
  score: number;
  findings: string[];
  recommendation: string;
}

interface Improvement {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
}

interface LLMAnalysis {
  overall_score?: number;
  grade_letter?: string;
  summary?: string;
  categories?: {
    performance?: CategoryData;
    mobile?: CategoryData;
    seo?: CategoryData;
    content?: CategoryData;
  };
  top_improvements?: Improvement[];
  upgrade_prompt?: string;
}

export default function WebsiteGradePage({ params }: { params: { websiteurl: string } }) {
  const [isLoading, setIsLoading] = useState(true);
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
  const [linkedinData, setLinkedinData] = useState<LinkedInData | null>(null);
  const [llmAnalysis, setLlmAnalysis] = useState<LLMAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [existsInFirebase, setExistsInFirebase] = useState(false);

  // Loading states for each API call
  const [websiteLoading, setWebsiteLoading] = useState(true);
  const [linkedinLoading, setLinkedinLoading] = useState(true);
  const [llmLoading, setLlmLoading] = useState(false);

  // Function to save data to Firebase
  const saveToFirebase = async (websiteData: WebsiteData, linkedinData: LinkedInData | null, llmAnalysis: LLMAnalysis) => {
    try {
      console.log('Attempting to save to Firebase:', { websiteUrl: params.websiteurl });
      const response = await fetch("/api/firebase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          websiteUrl: params.websiteurl,
          websiteData,
          linkedinData,
          llmAnalysis
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error('Failed to save to Firebase:', result);
      } else {
        console.log('Successfully saved to Firebase:', result);
      }
    } catch (error) {
      console.error("Error saving to Firebase:", error);
    }
  };

  // Check Firebase cache first
  const checkFirebaseCache = async (): Promise<boolean> => {
    try {
      console.log('Checking Firebase cache for:', params.websiteurl);
      const response = await fetch(`/api/firebase?websiteUrl=${encodeURIComponent(params.websiteurl)}`);
      const data = await response.json();
      if (data.error) {
        console.error('Failed to fetch from Firebase:', data.error);
        return false;
      }

      // Check if we have complete data
      if (response.ok && data.websiteData && data.llmAnalysis &&
        Object.keys(data.llmAnalysis).length > 0 && data.llmAnalysis.overall_score !== undefined) {
        console.log('Found complete cached data in Firebase');
        setWebsiteData(data.websiteData);
        setLinkedinData(data.linkedinData || null);
        setLlmAnalysis(data.llmAnalysis);
        setExistsInFirebase(true);
        setIsLoading(false);
        setWebsiteLoading(false);
        setLinkedinLoading(false);
        return true;
      }
      console.log('No complete cached data found in Firebase');
      return false;
    } catch (error) {
      console.error("Error checking Firebase cache:", error);
      return false;
    }
  };

  // Fetch website data using Exa API
  const fetchWebsiteData = async () => {
    try {
      setWebsiteLoading(true);
      const response = await fetch("/api/exa_website_scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteurl: params.websiteurl }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch website data");
      }

      const data = await response.json();
      setWebsiteData(data);
      return data;
    } catch (err) {
      console.error("Failed to load website data:", err);
      setError("Failed to load website data. Please check the URL and try again.");
      return null;
    } finally {
      setWebsiteLoading(false);
    }
  };

  // Fetch LinkedIn data using Exa API
  const fetchLinkedInData = async () => {
    try {
      setLinkedinLoading(true);
      const response = await fetch("/api/linkedin_content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ websiteurl: params.websiteurl }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch LinkedIn data");
      }

      const data = await response.json();
      setLinkedinData(data);
      return data;
    } catch (err) {
      console.error("Failed to load LinkedIn data:", err);
      return null;
    } finally {
      setLinkedinLoading(false);
    }
  };

  // Fetch LLM analysis using both website and LinkedIn data with streaming
  const fetchLLMAnalysis = async (websiteData: WebsiteData, linkedinData: LinkedInData | null) => {
    try {
      setLlmLoading(true);
      const response = await fetch("/api/llm_content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subpages: websiteData.results || [],
          mainpage: websiteData.results?.[0] || {},
          linkedinData: linkedinData?.results || [],
          websiteurl: params.websiteurl
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze content");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const decoder = new TextDecoder();
      let finalAnalysis = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            finalAnalysis = data.result;
            setLlmAnalysis(data.result);
          } catch (e) {
            console.error('Error parsing JSON:', e);
          }
        }
      }

      // Save to Firebase after streaming is complete
      if (websiteData && linkedinData !== undefined && finalAnalysis && Object.keys(finalAnalysis).length > 0) {
        console.log('Saving final data to Firebase');
        saveToFirebase(websiteData, linkedinData, finalAnalysis);
      }

      return finalAnalysis;
    } catch (err) {
      console.error("Failed to analyze content:", err);
      setError("Failed to analyze content. Please try again.");
      return null;
    } finally {
      setLlmLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const firebasePromise = checkFirebaseCache();
      const scrapingPromise = Promise.allSettled([
        fetchWebsiteData(),
        fetchLinkedInData()
      ]);

      const cachedDataFound = await firebasePromise;

      if (cachedDataFound) {
        console.log('Using cached data');
        return;
      }

      console.log('No cached data, waiting for scraping to complete');
      const [websiteResult, linkedinResult] = await scrapingPromise;

      const websiteData = websiteResult.status === 'fulfilled' ? websiteResult.value : null;
      const linkedinData = linkedinResult.status === 'fulfilled' ? linkedinResult.value : null;

      setIsLoading(false);

      if (websiteData) {
        await fetchLLMAnalysis(websiteData, linkedinData);
      }
    };

    loadData();
  }, [params.websiteurl]);

  return (
    <>
      <header className="relative top-0 left-0 w-full z-50 sm:shadow-sm bg-white">
        <div className="text-center sm:mb-2 sm:pb-2 space-y-2 opacity-0 animate-fade-up [animation-delay:200ms]">
          <Link href="/" className="pt-3 text-xl sm:text-2xl font-bold text-gray-900 hover:text-indigo-600 transition-colors inline-block">
            Site Upgrade
          </Link>
          <div className="text-gray-600 text-md sm:text-lg pb-2">
            AI-Powered Website Audit & Improvement
          </div>
        </div>
      </header>

      <div className="min-h-screen w-full max-w-5xl mx-auto px-4 py-10">

        {/* Loading States */}
        {(websiteLoading || linkedinLoading) && (
          <div className="flex items-center justify-center mt-10 opacity-0 animate-fade-up">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-indigo-600"></div>
              <p className="text-gray-600 text-lg">Scanning website...</p>
            </div>
          </div>
        )}

        {/* Website Preview */}
        {!isLoading && websiteData && websiteData.results && websiteData.results.length > 0 && (
          <div className="mb-10 opacity-0 animate-fade-up [animation-delay:300ms]">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {websiteData.results[0].image && (
                  <div className="flex-shrink-0 self-center sm:self-start">
                    <img
                      src={websiteData.results[0].image}
                      alt={websiteData.results[0].title || params.websiteurl}
                      className="h-20 rounded-lg object-cover border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {websiteData.results[0].title || params.websiteurl}
                  </h2>
                  <p className="text-gray-600 text-sm">{params.websiteurl}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center mt-10 mb-10">
            <div className="text-center p-8 bg-red-50 rounded-lg shadow-md">
              <h1 className="text-2xl font-bold text-red-600">Oops! Please Try Again</h1>
              <p className="text-gray-600 mt-2">{error}</p>
              <button
                onClick={() => window.location.href = '/'}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Go back and try again
              </button>
            </div>
          </div>
        )}

        {!isLoading && !error && !websiteData && (
          <div className="flex items-center justify-center">
            <p className="text-gray-600">Unable to analyze this website. Please try submitting again.</p>
          </div>
        )}

        {!isLoading && !error && websiteData && (
          <>
            {/* Grade Results */}
            {llmAnalysis && (
              <div className="mb-10 space-y-12">

                {/* Overall Score */}
                {llmAnalysis.overall_score !== undefined && llmAnalysis.grade_letter && (
                  <div className="flex flex-col items-center opacity-0 animate-fade-up [animation-delay:400ms]">
                    <ScoreCircle
                      score={llmAnalysis.overall_score}
                      gradeLetter={llmAnalysis.grade_letter}
                      size={220}
                    />
                    {llmAnalysis.summary && (
                      <p className="mt-6 text-center text-gray-700 max-w-2xl text-lg">
                        {llmAnalysis.summary}
                      </p>
                    )}
                  </div>
                )}

                {/* Category Scores */}
                {llmAnalysis.categories && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-0 animate-fade-up [animation-delay:600ms]">
                    {llmAnalysis.categories.performance && (
                      <CategoryCard
                        title="Performance"
                        emoji="🚀"
                        score={llmAnalysis.categories.performance.score}
                        findings={llmAnalysis.categories.performance.findings}
                        recommendation={llmAnalysis.categories.performance.recommendation}
                      />
                    )}
                    {llmAnalysis.categories.mobile && (
                      <CategoryCard
                        title="Mobile"
                        emoji="📱"
                        score={llmAnalysis.categories.mobile.score}
                        findings={llmAnalysis.categories.mobile.findings}
                        recommendation={llmAnalysis.categories.mobile.recommendation}
                      />
                    )}
                    {llmAnalysis.categories.seo && (
                      <CategoryCard
                        title="SEO"
                        emoji="🔍"
                        score={llmAnalysis.categories.seo.score}
                        findings={llmAnalysis.categories.seo.findings}
                        recommendation={llmAnalysis.categories.seo.recommendation}
                      />
                    )}
                    {llmAnalysis.categories.content && (
                      <CategoryCard
                        title="Content"
                        emoji="✍️"
                        score={llmAnalysis.categories.content.score}
                        findings={llmAnalysis.categories.content.findings}
                        recommendation={llmAnalysis.categories.content.recommendation}
                      />
                    )}
                  </div>
                )}

                {/* Improvements List */}
                {llmAnalysis.top_improvements && llmAnalysis.top_improvements.length > 0 && (
                  <div className="opacity-0 animate-fade-up [animation-delay:800ms]">
                    <ImprovementsList improvements={llmAnalysis.top_improvements} />
                  </div>
                )}

                {/* Upgrade Prompt */}
                {llmAnalysis.upgrade_prompt && (
                  <div className="opacity-0 animate-fade-up [animation-delay:1000ms]">
                    <UpgradePromptCard
                      prompt={llmAnalysis.upgrade_prompt}
                      websiteUrl={params.websiteurl}
                    />
                  </div>
                )}

                {/* Footer CTA */}
                <footer className="w-full py-6 px-8 mb-6 mt-8 opacity-0 animate-fade-up [animation-delay:1200ms]">
                  <div className="max-w-md mx-auto flex flex-col items-center gap-4">
                    <Link
                      href="/"
                      className="w-full max-w-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 px-8 rounded-lg transition-all flex items-center justify-center gap-3 group text-lg hover:scale-105 hover:shadow-xl shadow-lg"
                    >
                      <span>Grade Another Website</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </footer>

              </div>
            )}

            {llmLoading && (
              <div className="flex items-center justify-center mt-10">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-indigo-600"></div>
                  <p className="text-gray-600 text-lg">Analyzing your website...</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
