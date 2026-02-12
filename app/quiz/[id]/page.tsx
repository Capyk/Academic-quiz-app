'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import allQuizzes from '@/data/questions.json';

export default function QuizPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const quiz = (allQuizzes as any)[id];

    // State
    const [currentIdx, setCurrentIdx] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, number>>({}); // maps step_index -> selected_option_index
    const [quizOrder, setQuizOrder] = useState<number[]>([]); // maps step_index -> original_question_index
    const [optionsOrder, setOptionsOrder] = useState<Record<number, number[]>>({}); // maps step_index -> shuffled_option_indices
    const [viewMode, setViewMode] = useState<'loading' | 'quiz' | 'score' | 'review'>('loading');
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // Init Effect
    useEffect(() => {
        if (!quiz) return;

        const total = quiz.questions.length;
        const savedProgress = localStorage.getItem(`quiz_progress_${id}`);
        const savedCompleted = localStorage.getItem(`quiz_completed_${id}`);

        if (savedProgress) {
            // Restore active session
            try {
                const { answers, index, order, optOrder } = JSON.parse(savedProgress);
                setUserAnswers(answers || {});
                setCurrentIdx(index || 0);

                let loadedOrder = order;
                if (!loadedOrder || loadedOrder.length !== total) {
                    loadedOrder = [...Array(total).keys()];
                }
                setQuizOrder(loadedOrder);

                if (optOrder) {
                    setOptionsOrder(optOrder);
                } else {
                    // Generate linear options for legacy saves
                    const linearOpts: Record<number, number[]> = {};
                    loadedOrder.forEach((qIdx: number, stepIdx: number) => {
                        const q = quiz.questions[qIdx];
                        linearOpts[stepIdx] = [...Array(q.options.length).keys()];
                    });
                    setOptionsOrder(linearOpts);
                }

                setViewMode('quiz');
            } catch (e) {
                startNewQuiz(total);
            }
        } else if (savedCompleted) {
            // Restore completed session
            try {
                const { answers, order, optOrder } = JSON.parse(savedCompleted);
                if (answers) setUserAnswers(answers);

                let loadedOrder = order;
                if (!loadedOrder || loadedOrder.length !== total) {
                    loadedOrder = [...Array(total).keys()];
                }
                setQuizOrder(loadedOrder);

                if (optOrder) {
                    setOptionsOrder(optOrder);
                } else {
                    const linearOpts: Record<number, number[]> = {};
                    loadedOrder.forEach((qIdx: number, stepIdx: number) => {
                        const q = quiz.questions[qIdx];
                        linearOpts[stepIdx] = [...Array(q.options.length).keys()];
                    });
                    setOptionsOrder(linearOpts);
                }

                setViewMode('score');
            } catch (e) {
                startNewQuiz(total);
            }
        } else {
            // New Session
            startNewQuiz(total);
        }
    }, [id, quiz]);

    const startNewQuiz = (total: number) => {
        // Shuffle questions
        const newOrder = [...Array(total).keys()].sort(() => Math.random() - 0.5);
        setQuizOrder(newOrder);

        // Shuffle options for each question
        const newOptionsOrder: Record<number, number[]> = {};
        newOrder.forEach((originalQIdx, stepIdx) => {
            const q = quiz.questions[originalQIdx];
            // Create array [0, 1, 2, ...] and shuffle it
            newOptionsOrder[stepIdx] = [...Array(q.options.length).keys()].sort(() => Math.random() - 0.5);
        });
        setOptionsOrder(newOptionsOrder);

        setUserAnswers({});
        setCurrentIdx(0);
        setViewMode('quiz');
        // Clear any completion status so it looks like a fresh start? 
        // No, keep completion history until they finish again.
        // But clear progress.
        localStorage.removeItem(`quiz_progress_${id}`);
    };

    // Save Progress Effect
    useEffect(() => {
        if (viewMode === 'quiz' && quizOrder.length > 0) {
            localStorage.setItem(`quiz_progress_${id}`, JSON.stringify({
                answers: userAnswers,
                index: currentIdx,
                order: quizOrder,
                optOrder: optionsOrder
            }));
        }
    }, [userAnswers, currentIdx, quizOrder, optionsOrder, viewMode, id]);

    if (!quiz || viewMode === 'loading') return <div className="p-20 text-center font-black animate-pulse uppercase tracking-widest font-sans">Loading...</div>;

    const total = quiz.questions.length;
    // Get current actual question index from the shuffled order
    const questionIdx = quizOrder[currentIdx];
    const question = quiz.questions[questionIdx];
    const currentOptions = optionsOrder[currentIdx] || [...Array(question.options.length).keys()];

    // Calculate Score
    const currentScore = quizOrder.reduce((acc: number, qIdx: number, stepIdx: number) => {
        const correct = quiz.questions[qIdx].correct_index;
        const answer = userAnswers[stepIdx];
        return acc + (answer === correct ? 1 : 0);
    }, 0);

    const hasAnswered = userAnswers[currentIdx] !== undefined;
    const isReviewing = viewMode === 'review';

    // --- HANDLERS ---

    const handleSelect = (originalIdx: number) => {
        if (hasAnswered || isReviewing) return;
        setUserAnswers({ ...userAnswers, [currentIdx]: originalIdx });
    };

    const handleBack = () => {
        if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
    };

    const handleNext = () => {
        if (currentIdx < total - 1) {
            setCurrentIdx(currentIdx + 1);
        } else {
            if (isReviewing) {
                // Return to Score Screen
                setViewMode('score');
            } else {
                // Finish Quiz
                finishQuiz();
            }
        }
    };

    const finishQuiz = () => {
        const finalScore = quizOrder.reduce((acc: number, qIdx: number, stepIdx: number) => {
            const correct = quiz.questions[qIdx].correct_index;
            const answer = userAnswers[stepIdx];
            return acc + (answer === correct ? 1 : 0);
        }, 0);

        localStorage.setItem(`quiz_completed_${id}`, JSON.stringify({
            score: finalScore,
            total: total,
            date: new Date().toISOString(),
            answers: userAnswers,
            order: quizOrder,
            optOrder: optionsOrder
        }));

        localStorage.removeItem(`quiz_progress_${id}`);
        setViewMode('score');
    };

    const handleRetake = () => {
        startNewQuiz(total);
        setShowExitConfirm(false);
    };

    // --- VIEWS ---

    if (viewMode === 'score') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
                <div className="text-7xl mb-6 font-sans">🎓</div>
                <h1 className="text-4xl font-black text-slate-900 mb-2 font-sans">Quiz Completed!</h1>
                <p className="text-xl text-slate-500 mb-8 font-medium font-sans">Final Score: <span className="text-blue-600 font-black">{currentScore} / {total}</span></p>

                {/* Results Grid */}
                <div className="grid grid-cols-5 gap-3 mb-8 w-full max-w-xs">
                    {quizOrder.map((qIdx, index) => {
                        const isCorrect = userAnswers[index] === quiz.questions[qIdx].correct_index;
                        return (
                            <button
                                key={index}
                                onClick={() => { setCurrentIdx(index); setViewMode('review'); }}
                                className={`aspect-square rounded-xl font-black text-xs flex items-center justify-center transition-all hover:scale-110 ${isCorrect
                                    ? 'bg-green-100 text-green-700 border-2 border-green-200 hover:bg-green-200 hover:border-green-300'
                                    : 'bg-red-100 text-red-700 border-2 border-red-200 hover:bg-red-200 hover:border-red-300'
                                    }`}
                                title={isCorrect ? "Correct" : "Incorrect"}
                            >
                                {index + 1}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button onClick={() => router.push('/')} className="bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl font-sans uppercase tracking-widest text-xs">
                        Back to Dashboard
                    </button>
                    <button onClick={() => { setCurrentIdx(0); setViewMode('review'); }} className="bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-xl font-sans uppercase tracking-widest text-xs">
                        Review All Answers
                    </button>
                    <button onClick={handleRetake} className="text-slate-400 font-bold hover:text-blue-600 text-sm py-4 transition-all uppercase tracking-widest font-sans">
                        Retake Quiz
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isReviewing ? 'bg-amber-50' : 'bg-slate-50'} py-6 md:py-12 px-4 font-sans text-slate-900 transition-colors duration-500`}>
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    {isReviewing ? (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setViewMode('score')}
                                className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-200 transition-colors font-sans"
                            >
                                ← Exit Review
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 font-sans">Review Mode</span>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setShowExitConfirm(true)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-all px-2 font-sans">
                            ✕ Options
                        </button>
                    )}

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
                    <div className={`h-full transition-all duration-500 ease-out ${isReviewing ? 'bg-amber-400' : 'bg-blue-500'}`} style={{ width: `${((currentIdx + 1) / total) * 100}%` }} />
                </div>

                {/* Content Card */}
                <div className="bg-white rounded-[2.5rem] p-7 md:p-10 shadow-sm border border-slate-100 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight mb-8 font-sans">
                        {question.question}
                    </h2>

                    <div className="grid gap-3">
                        {currentOptions.map((originalIndex: number, visualIndex: number) => {
                            const opt = question.options[originalIndex];

                            const isSelected = userAnswers[currentIdx] === originalIndex;
                            const isCorrect = originalIndex === question.correct_index;

                            let iconStyle = isSelected ? "bg-blue-600 text-white" : "bg-white border-2 border-slate-100 text-slate-400";
                            let cardStyle = isSelected ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-50' : 'border-slate-50 bg-slate-50 hover:border-slate-200';

                            // Show results immediately if answered OR reviewing
                            if (hasAnswered || isReviewing) {
                                if (isCorrect) {
                                    iconStyle = "bg-green-600 text-white";
                                    cardStyle = "border-green-500 bg-green-50 text-green-900";
                                } else if (isSelected) {
                                    iconStyle = "bg-red-500 text-white";
                                    cardStyle = "border-red-500 bg-red-50 text-red-900";
                                } else {
                                    // Not selected, not correct -> dim
                                    cardStyle = "border-slate-50 bg-slate-50 opacity-50 grayscale";
                                }
                            }

                            return (
                                <button
                                    key={visualIndex}
                                    onClick={() => handleSelect(originalIndex)}
                                    disabled={hasAnswered || isReviewing}
                                    className={`flex items-center p-5 rounded-2xl border-2 transition-all text-left font-semibold font-sans ${cardStyle}`}
                                >
                                    <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl mr-4 text-[11px] font-black font-sans transition-colors ${iconStyle}`}>
                                        {String.fromCharCode(65 + visualIndex)}
                                    </div>
                                    {opt}
                                </button>
                            );
                        })}
                    </div>

                    {(hasAnswered || isReviewing) && (
                        <div className="mt-8 p-6 bg-slate-900 rounded-3xl text-white animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 font-sans">Rationale</span>
                                {isReviewing && (userAnswers[currentIdx] === question.correct_index ?
                                    <span className="bg-green-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Correct</span> :
                                    <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Incorrect</span>
                                )}
                            </div>
                            <p className="text-sm text-slate-300 italic font-sans font-medium leading-relaxed">"{question.rationale}"</p>
                        </div>
                    )}
                </div>

                {/* Nav Buttons */}
                <div className="flex justify-between items-center px-4">
                    <button
                        onClick={handleBack}
                        className={`text-[11px] font-black uppercase tracking-widest transition-all font-sans ${currentIdx === 0 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-slate-900'}`}
                    >
                        ← Back
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={!hasAnswered && !isReviewing}
                        className={`text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:scale-100 disabled:shadow-none transition-all shadow-xl font-sans ${isReviewing ? 'bg-amber-500 shadow-amber-200 hover:bg-amber-600' : 'bg-blue-600 shadow-blue-200 hover:bg-slate-900'}`}
                    >
                        {currentIdx === total - 1 ? (isReviewing ? 'Finish Review' : 'Finish') : 'Next →'}
                    </button>
                </div>

                {/* Exit Modal */}
                {showExitConfirm && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center">
                            <h3 className="text-2xl font-black text-slate-900 mb-6 font-sans">Quiz Options</h3>
                            <div className="flex flex-col gap-3">
                                <button onClick={() => router.push('/')} className="bg-slate-900 text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-widest font-sans">
                                    Save & Exit to Menu
                                </button>
                                <button onClick={handleRetake} className="bg-red-50 text-red-600 py-4 rounded-2xl font-bold uppercase text-xs border border-red-100 tracking-widest font-sans">
                                    Restart Quiz
                                </button>
                                <button onClick={() => setShowExitConfirm(false)} className="text-slate-400 py-2 font-bold uppercase text-[10px] mt-2 font-sans tracking-widest">
                                    Continue
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}