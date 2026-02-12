'use client';
import Link from 'next/link';
import allQuizzes from '@/data/questions.json';
import { useEffect, useState } from 'react';

export default function Home() {
  const quizzes = Object.entries(allQuizzes);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [completed, setCompleted] = useState<Record<string, any>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const newProgress: Record<string, number> = {};
    const newCompleted: Record<string, any> = {};

    Object.keys(allQuizzes).forEach((id) => {
      // Check for saved progress
      const savedProgress = localStorage.getItem(`quiz_progress_${id}`);
      if (savedProgress) {
        try {
          const { index } = JSON.parse(savedProgress);
          if (typeof index === 'number') {
            newProgress[id] = index;
          }
        } catch (e) {
          console.error("Failed to parse progress for quiz:", id);
        }
      }

      // Check for completion
      const savedCompletion = localStorage.getItem(`quiz_completed_${id}`);
      if (savedCompletion) {
        try {
          newCompleted[id] = JSON.parse(savedCompletion);
        } catch (e) {
          // Fallback for simple string if needed, or ignore
          newCompleted[id] = { date: new Date().toISOString() };
        }
      }
    });

    setProgress(newProgress);
    setCompleted(newCompleted);
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans">
      <div className="max-w-4xl mx-auto text-center">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Academic Quiz Hub</h1>
          <p className="text-slate-600 font-medium">Select a module to challenge your knowledge</p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 text-left">
          {quizzes.map(([id, quiz]: [string, any]) => {
            const currentIdx = progress[id];
            const isCompleted = !!completed[id];
            const completionData = completed[id];
            const hasProgress = currentIdx !== undefined && !isCompleted;

            let cardStyle = "border-slate-200 hover:border-blue-500";
            let badgeStyle = "bg-blue-100 text-blue-700";
            let badgeText = "Module";
            let actionText = "Start Assessment";
            let actionColor = "text-blue-600";

            if (isCompleted) {
              cardStyle = "border-green-200 bg-green-50/30 hover:border-green-500 hover:shadow-green-100/50";
              badgeStyle = "bg-green-100 text-green-700";
              badgeText = "Completed";
              actionText = "Review Quiz";
              actionColor = "text-green-600";
            } else if (hasProgress) {
              cardStyle = "border-blue-200 ring-1 ring-blue-100";
              badgeStyle = "bg-blue-600 text-white";
              badgeText = "In Progress";
              actionText = `Resume Question ${currentIdx + 1}`;
            }

            return (
              <Link href={`/quiz/${id}`} key={id}>
                <div className={`group bg-white p-8 rounded-3xl shadow-sm border transition-all cursor-pointer h-full relative overflow-hidden hover:shadow-xl ${cardStyle}`}>

                  {/* Progress Indicator (In Progress) */}
                  {hasProgress && isLoaded && (
                    <div className="absolute top-0 left-0 h-1 bg-blue-100 w-full">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${((currentIdx + 1) / quiz.questions.length) * 100}%` }}
                      />
                    </div>
                  )}

                  {/* Top Badge & Count */}
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider ${badgeStyle}`}>
                      {badgeText}
                    </span>
                    <div className="text-right">
                      <span className="text-slate-400 text-xs font-bold block">{quiz.questions.length} Questions</span>
                      {isCompleted && completionData?.score !== undefined && (
                        <span className="text-[10px] font-black text-green-600 uppercase tracking-widest block mt-1">
                          Score: {completionData.score}/{completionData.total || quiz.questions.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className={`text-2xl font-bold transition-colors ${isCompleted ? 'text-slate-700 group-hover:text-green-700' : 'text-slate-800 group-hover:text-blue-600'}`}>
                    {quiz.title}
                  </h3>

                  <div className={`mt-6 flex items-center font-bold uppercase text-xs tracking-widest ${actionColor}`}>
                    {actionText} <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}