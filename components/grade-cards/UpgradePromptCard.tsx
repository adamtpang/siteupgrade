// components/grade-cards/UpgradePromptCard.tsx
"use client";

import { useState } from 'react';

interface UpgradePromptCardProps {
    prompt: string;
    websiteUrl: string;
}

export function UpgradePromptCard({ prompt, websiteUrl }: UpgradePromptCardProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🔧</span>
                    <h3 className="text-xl font-semibold text-gray-900">Upgrade Prompt</h3>
                </div>
                <button
                    onClick={handleCopy}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${copied
                            ? 'bg-green-500 text-white'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                >
                    {copied ? '✓ Copied!' : 'Copy Prompt'}
                </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
                Use this prompt with AI coding assistants (Claude, ChatGPT, Cursor) to implement improvements:
            </p>

            <div className="bg-white rounded-lg p-4 border border-indigo-100 max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                    {prompt}
                </pre>
            </div>

            <div className="mt-4 flex gap-2 flex-wrap">
                <a
                    href={`https://claude.ai/new?text=${encodeURIComponent(prompt)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors"
                >
                    Open in Claude →
                </a>
                <a
                    href={`https://chat.openai.com/?q=${encodeURIComponent(prompt)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium hover:bg-emerald-200 transition-colors"
                >
                    Open in ChatGPT →
                </a>
            </div>
        </div>
    );
}
