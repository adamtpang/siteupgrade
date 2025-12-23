// components/LandingPage.tsx

"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import AnimatedGradientText from "./ui/animated-gradient-text";
import { ChevronRight, CheckCircle } from "lucide-react";
import { cleanUrl, isValidDomain } from "@/lib/url-utils";

export default function LandingPage() {
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGrade = async (e: FormEvent) => {
    e.preventDefault();
    console.log("Website grade initiated.");

    if (!websiteUrl) {
      setError("Please enter your website URL to get graded.");
      return;
    }

    setError(null);
    setIsLoading(true);

    const cleanedUrl = cleanUrl(websiteUrl);

    if (!isValidDomain(cleanedUrl)) {
      setError("Please enter a valid website URL (e.g., example.com)");
      setIsLoading(false);
      return;
    }

    router.push(`/${cleanedUrl}`);
  };

  return (
    <div className="flex flex-col min-h-screen w-full md:max-w-4xl z-0">
      {/* Badge positioned at the top */}
      <div className="w-full flex justify-center pt-6 opacity-0 animate-fade-up [animation-delay:200ms]">
        <Link href="https://exa.ai" target="_blank">
          <AnimatedGradientText>
            <span className="px-1 inline animate-gradient bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:var(--bg-size)_100%] bg-clip-text text-transparent">
              Powered by Exa AI
            </span>
            <ChevronRight className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5 text-indigo-600" />
          </AnimatedGradientText>
        </Link>
      </div>

      <main className="flex flex-col justify-center flex-grow w-full md:max-w-4xl p-2 md:p-6">
        <h1 className="md:text-6xl text-4xl pb-5 font-medium opacity-0 animate-fade-up [animation-delay:200ms]">
          Site
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Upgrade </span>
        </h1>

        <p className="text-gray-600 mb-8 opacity-0 animate-fade-up [animation-delay:400ms] text-lg">
          Get an AI-powered website audit and an upgrade prompt to improve your site
        </p>

        {/* Features */}
        <div className="flex flex-wrap gap-4 mb-8 opacity-0 animate-fade-up [animation-delay:500ms]">
          <div className="flex items-center gap-2 text-gray-600">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Performance Score</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>SEO Analysis</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Mobile Check</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Upgrade Prompt</span>
          </div>
        </div>

        <form onSubmit={handleGrade} className="space-y-6">
          <input
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="Enter Your Website URL"
            autoFocus
            className="w-full bg-white p-4 border box-border outline-none rounded-lg ring-2 ring-indigo-500 focus:ring-indigo-600 resize-none opacity-0 animate-fade-up [animation-delay:600ms] text-lg"
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full font-semibold px-4 py-4 rounded-lg transition-all opacity-0 animate-fade-up [animation-delay:800ms] min-h-[56px] text-lg ${isLoading
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
              }`}
          >
            {isLoading ? 'Analyzing...' : 'Grade My Website'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </main>

      <footer className="w-full py-6 px-8 mb-6 mt-auto opacity-0 animate-fade-up [animation-delay:600ms]">
        <div className="max-w-md mx-auto flex flex-col items-center gap-6">
          <Link
            href="https://dashboard.exa.ai/"
            target="_blank"
            className="w-full max-w-xl bg-black hover:bg-gray-900 text-white font-medium py-2 md:py-3 px-4 md:px-6 rounded-lg transition-all flex items-center justify-center gap-2 group whitespace-normal text-sm md:text-base hover:scale-[1.02] hover:shadow-lg"
          >
            <span>Built with Exa API - Try here</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </Link>

          <p className="text-sm text-center text-gray-500">
            Free website audit • No signup required
          </p>
        </div>
      </footer>
    </div>
  );
}
