// components/grade-cards/ScoreCircle.tsx
"use client";

import { useEffect, useState } from 'react';

interface ScoreCircleProps {
    score: number;
    gradeLetter: string;
    size?: number;
}

export function ScoreCircle({ score, gradeLetter, size = 200 }: ScoreCircleProps) {
    const [animatedScore, setAnimatedScore] = useState(0);

    useEffect(() => {
        const duration = 1500;
        const steps = 60;
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

    const getGradeColor = (score: number) => {
        if (score >= 90) return { stroke: '#10b981', bg: 'from-emerald-500 to-green-500' };
        if (score >= 80) return { stroke: '#22c55e', bg: 'from-green-500 to-lime-500' };
        if (score >= 70) return { stroke: '#84cc16', bg: 'from-lime-500 to-yellow-500' };
        if (score >= 60) return { stroke: '#eab308', bg: 'from-yellow-500 to-orange-500' };
        if (score >= 50) return { stroke: '#f97316', bg: 'from-orange-500 to-red-500' };
        return { stroke: '#ef4444', bg: 'from-red-500 to-red-600' };
    };

    const colors = getGradeColor(score);
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative" style={{ width: size, height: size }}>
                {/* Background circle */}
                <svg className="transform -rotate-90" width={size} height={size}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#e5e7eb"
                        strokeWidth="12"
                        fill="none"
                    />
                    {/* Animated progress circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={colors.stroke}
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 0.1s ease-out' }}
                    />
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-gray-900">{animatedScore}</span>
                    <span className={`text-2xl font-bold bg-gradient-to-r ${colors.bg} bg-clip-text text-transparent`}>
                        {gradeLetter}
                    </span>
                </div>
            </div>
            <p className="mt-4 text-gray-600 text-lg">Overall Score</p>
        </div>
    );
}
