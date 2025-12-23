// components/grade-cards/ImprovementsList.tsx
"use client";

interface Improvement {
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
}

interface ImprovementsListProps {
    improvements: Improvement[];
}

export function ImprovementsList({ improvements }: ImprovementsListProps) {
    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'low':
                return 'bg-green-100 text-green-700 border-green-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'high':
                return '🔴';
            case 'medium':
                return '🟡';
            case 'low':
                return '🟢';
            default:
                return '⚪';
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🎯</span>
                <h3 className="text-xl font-semibold text-gray-900">Top Improvements</h3>
            </div>

            <div className="space-y-4">
                {improvements.map((improvement, index) => (
                    <div
                        key={index}
                        className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold text-gray-900">
                                    {index + 1}. {improvement.title}
                                </span>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityBadge(improvement.priority)}`}>
                                {getPriorityIcon(improvement.priority)} {improvement.priority.toUpperCase()}
                            </span>
                        </div>

                        <p className="text-gray-700 text-sm mb-2">{improvement.description}</p>

                        <p className="text-sm text-gray-500">
                            <span className="font-medium">Impact:</span> {improvement.impact}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
