'use client';
import Link from 'next/link';
import allQuizzes from '@/data/questions.json';

export default function Home() {
  const quizzes = Object.entries(allQuizzes);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans">
      <div className="max-w-4xl mx-auto text-center">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Academic Quiz Hub</h1>
          <p className="text-slate-600 font-medium">Select a module to challenge your knowledge</p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 text-left">
          {quizzes.map(([id, quiz]: [string, any]) => (
            <Link href={`/quiz/${id}`} key={id}>
              <div className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer h-full">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-wider">Module</span>
                  <span className="text-slate-400 text-xs font-bold">{quiz.questions.length} Questions</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {quiz.title}
                </h3>
                <div className="mt-6 flex items-center text-blue-600 font-bold uppercase text-xs tracking-widest">
                  Start Assessment <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}