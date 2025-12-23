// components/grade-cards/CategoryCard.tsx
"use client";

import { useEffect, useState } from 'react';

interface CategoryCardProps {
    title: string;
    emoji: string;
    score: number;
    findings: string[];
    recommendation: string;
}

export function CategoryCard({ title, emoji, score, findings, recommendation }: CategoryCardProps) {
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        const duration = 1000;
        const steps = 40;
        const increment = score / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= score) {
                setAnimatedScore(score);
                clearInterval(timer);
            } else {
                setAnimatedScore(Math.round(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [score]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-100';
        if (score >= 60) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    const getProgressColor = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                </div>
                <div className={`px-3 py-1 rounded-full font-bold ${getScoreColor(score)}`}>
                    {animatedScore}/100
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(score)}`}
                    style={{ width: `${animatedScore}%` }}
                />
            </div>

            {/* Findings */}
            <div className="space-y-2 mb-4">
                {findings.map((finding, index) => (
                    <div key={index} className="flex items-start gap-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <p className="text-gray-700 text-sm">{finding}</p>
                    </div>
                ))}
            </div>

            {/* Recommendation */}
            <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">Recommendation:</span> {recommendation}
                </p>
            </div>
        </div>
    );
}
