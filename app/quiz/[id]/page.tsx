'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import allQuizzes from '@/data/questions.json';

export default function QuizPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [currentIdx, setCurrentIdx] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
    const [isFinished, setIsFinished] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const quiz = (allQuizzes as any)[id];

    // 1. Load progress from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(`quiz_progress_${id}`);
        if (saved) {
            const { answers, index } = JSON.parse(saved);
            setUserAnswers(answers || {});
            setCurrentIdx(index || 0);
        }
        setIsLoaded(true);
    }, [id]);

    // 2. Save progress to localStorage whenever state changes
    useEffect(() => {
        if (isLoaded && !isFinished) {
            localStorage.setItem(`quiz_progress_${id}`, JSON.stringify({
                answers: userAnswers,
                index: currentIdx
            }));
        }
    }, [userAnswers, currentIdx, id, isLoaded, isFinished]);

    if (!quiz || !isLoaded) return <div className="p-20 text-center font-black animate-pulse uppercase tracking-widest font-sans">Loading...</div>;

    const question = quiz.questions[currentIdx];
    const total = quiz.questions.length;
    const currentScore = quiz.questions.filter((q: any, i: number) => userAnswers[i] === q.correct_index).length;
    const hasAnswered = userAnswers[currentIdx] !== undefined;

    // --- NAVIGATION FUNCTIONS ---

    const handleSelect = (idx: number) => {
        if (hasAnswered) return;
        setUserAnswers({ ...userAnswers, [currentIdx]: idx });
    };

    const handleBack = () => {
        if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
    };

    const handleNext = () => {
        if (currentIdx < total - 1) {
            setCurrentIdx(currentIdx + 1);
        } else {
            localStorage.removeItem(`quiz_progress_${id}`); // Clear storage only when finished
            setIsFinished(true);
        }
    };

    const handleReset = () => {
        localStorage.removeItem(`quiz_progress_${id}`);
        setUserAnswers({});
        setCurrentIdx(0);
        setIsFinished(false);
        setShowExitConfirm(false);
    };

    // --- RENDER LOGIC ---

    if (isFinished) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
                <div className="text-7xl mb-6 font-sans">🎓</div>
                <h1 className="text-4xl font-black text-slate-900 mb-2 font-sans">Quiz Completed!</h1>
                <p className="text-xl text-slate-500 mb-8 font-medium font-sans">Final Score: <span className="text-blue-600 font-black">{currentScore} / {total}</span></p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button onClick={() => router.push('/')} className="bg-slate-900 text-white py-5 rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl font-sans">
                        BACK TO DASHBOARD
                    </button>
                    <button onClick={handleReset} className="text-slate-400 font-bold hover:text-red-500 text-sm py-2 transition-all uppercase tracking-widest font-sans">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-6 md:py-12 px-4 font-sans text-slate-900">
            <div className="max-w-2xl mx-auto">

                {/* TOP NAV BAR */}
                <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <button onClick={() => setShowExitConfirm(true)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-all px-2 font-sans">
                        ✕ Options
                    </button>
                    <div className="flex gap-6">
                        <div className="text-right">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block leading-none font-sans">Score</span>
                            <span className="text-lg font-black text-blue-600 leading-tight font-sans">{currentScore} pts</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block leading-none font-sans">Progress</span>
                            <span className="text-lg font-black text-slate-700 leading-tight font-sans">{currentIdx + 1}/{total}</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-200 rounded-full mb-8 overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-500 ease-out" style={{ width: `${((currentIdx + 1) / total) * 100}%` }} />
                </div>

                {/* Question Card */}
                <div className="bg-white rounded-[2.5rem] p-7 md:p-10 shadow-sm border border-slate-100 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight mb-8 font-sans">
                        {question.question}
                    </h2>

                    <div className="grid gap-3">
                        {question.options.map((opt: string, i: number) => {
                            const isSelected = userAnswers[currentIdx] === i;
                            const isCorrect = i === question.correct_index;

                            let iconStyle = isSelected ? "bg-blue-600 text-white" : "bg-white border-2 border-slate-100 text-slate-400";
                            if (hasAnswered) {
                                if (isCorrect) iconStyle = "bg-green-600 text-white";
                                else if (isSelected) iconStyle = "bg-red-600 text-white";
                            }

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleSelect(i)}
                                    className={`flex items-center p-5 rounded-2xl border-2 transition-all text-left font-semibold font-sans ${hasAnswered ? (isCorrect ? 'border-green-500 bg-green-50 text-green-800' : isSelected ? 'border-red-500 bg-red-50 text-red-800' : 'opacity-40 grayscale-[0.5]') :
                                            isSelected ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-50' : 'border-slate-50 bg-slate-50 hover:border-slate-200'
                                        }`}
                                >
                                    <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl mr-4 text-[11px] font-black font-sans transition-colors ${iconStyle}`}>
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    {opt}
                                </button>
                            );
                        })}
                    </div>

                    {hasAnswered && (
                        <div className="mt-8 p-6 bg-slate-900 rounded-3xl text-white animate-in slide-in-from-bottom-4 duration-500">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 block mb-2 font-sans font-bold">Rationale</span>
                            <p className="text-sm text-slate-300 italic font-sans font-medium leading-relaxed">"{question.rationale}"</p>
                        </div>
                    )}
                </div>

                {/* Navigation Bottom */}
                <div className="flex justify-between items-center px-4">
                    <button
                        onClick={handleBack}
                        className={`text-[11px] font-black uppercase tracking-widest transition-all font-sans ${currentIdx === 0 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-slate-900'}`}
                    >
                        ← Back
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={!hasAnswered}
                        className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-xl shadow-blue-100 font-sans"
                    >
                        {currentIdx === total - 1 ? 'Finish' : 'Next →'}
                    </button>
                </div>

                {/* OPTIONS MODAL */}
                {showExitConfirm && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center">
                            <h3 className="text-2xl font-black text-slate-900 mb-6 font-sans">Quiz Options</h3>
                            <div className="flex flex-col gap-3">
                                <button onClick={() => router.push('/')} className="bg-slate-900 text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-widest font-sans">
                                    Save & Exit to Menu
                                </button>
                                <button onClick={handleReset} className="bg-red-50 text-red-600 py-4 rounded-2xl font-bold uppercase text-xs border border-red-100 tracking-widest font-sans">
                                    Reset & Start Over
                                </button>
                                <button onClick={() => setShowExitConfirm(false)} className="text-slate-400 py-2 font-bold uppercase text-[10px] mt-2 font-sans tracking-widest">
                                    Continue Current Quiz
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}