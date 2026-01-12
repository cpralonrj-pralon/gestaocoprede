import React, { useState, useRef, useEffect } from 'react';

interface Props {
    currentDate: Date;
    onChange: (date: Date) => void;
}

export const MonthPicker: React.FC<Props> = ({ currentDate, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const handlePrev = () => {
        const next = new Date(currentDate);
        next.setMonth(next.getMonth() - 1);
        onChange(next);
    };

    const handleNext = () => {
        const next = new Date(currentDate);
        next.setMonth(next.getMonth() + 1);
        onChange(next);
    };

    const handleMonthSelect = (mIdx: number) => {
        const next = new Date(currentDate);
        next.setMonth(mIdx);
        onChange(next);
        setIsOpen(false);
    };

    const handleYearChange = (offset: number) => {
        const next = new Date(currentDate);
        next.setFullYear(next.getFullYear() + offset);
        onChange(next);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-[1.2rem] border border-slate-200 dark:border-slate-700 shadow-sm">
                <button
                    onClick={handlePrev}
                    className="size-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-90"
                >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="px-6 py-2 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors group"
                >
                    <span className="text-[13px] font-black dark:text-white uppercase tracking-[0.25em] whitespace-nowrap">
                        {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <span className={`material-symbols-outlined text-sm text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                        expand_more
                    </span>
                </button>

                <button
                    onClick={handleNext}
                    className="size-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-90"
                >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-3 w-72 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-[500] p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={() => handleYearChange(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                            <span className="material-symbols-outlined text-sm">keyboard_double_arrow_left</span>
                        </button>
                        <span className="text-sm font-black dark:text-white uppercase tracking-widest">{currentDate.getFullYear()}</span>
                        <button onClick={() => handleYearChange(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                            <span className="material-symbols-outlined text-sm">keyboard_double_arrow_right</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {months.map((m, idx) => (
                            <button
                                key={m}
                                onClick={() => handleMonthSelect(idx)}
                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${currentDate.getMonth() === idx ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                            >
                                {m.substring(0, 3)}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
