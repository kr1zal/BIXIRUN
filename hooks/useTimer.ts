import { useEffect } from 'react';
import { Platform, Vibration } from 'react-native';
import { useAppDispatch, useAppSelector } from '../app/store/hooks';
import {
    decrementSeconds,
    nextPhase,
    pauseTimer,
    resetTimer,
    startTimer
} from '../app/store/slices/timerSlice';
import { playBeep } from '../app/utils/sound';

export const useTimer = () => {
    const dispatch = useAppDispatch();
    const timer = useAppSelector((state) => state.timer);

    // Основной таймер
    useEffect(() => {
        if (!timer.running) return;

        const id = setInterval(() => {
            if (timer.seconds > 0) {
                dispatch(decrementSeconds());
            } else {
                dispatch(nextPhase());

                // Вибрация и звук при смене фазы
                if (Platform.OS === 'ios' || Platform.OS === 'android') {
                    Vibration.vibrate(500);
                }
                playBeep().catch(console.error);
            }
        }, 1000);

        return () => clearInterval(id);
    }, [timer.running, timer.seconds, dispatch]);

    // Функции управления таймером
    const start = () => dispatch(startTimer());
    const pause = () => dispatch(pauseTimer());
    const reset = () => dispatch(resetTimer());

    // Вычисление прогресса
    const getMaxValue = () => {
        switch (timer.phase) {
            case 'prep': return timer.prep;
            case 'work': return timer.work;
            case 'rest': return timer.rest;
            case 'restSet': return timer.restBetweenSets;
            default: return 1;
        }
    };

    const maxValue = getMaxValue();
    const progress = maxValue > 0 ? 1 - timer.seconds / maxValue : 1;

    // Получение информации о фазе
    const getPhaseInfo = () => {
        switch (timer.phase) {
            case 'prep': return { name: 'Подготовка', color: '#fb8c00' };
            case 'work': return { name: 'Работа', color: '#e53935' };
            case 'rest': return { name: 'Отдых', color: '#43a047' };
            case 'restSet': return { name: 'Отдых между сетами', color: '#1e88e5' };
            case 'done': return { name: 'Завершено', color: '#8e24aa' };
        }
    };

    // Форматирование времени
    const formatTime = (secs: number) => {
        const minutes = Math.floor(secs / 60);
        const seconds = secs % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Получение текста прогресса
    const getProgressText = () => {
        if (timer.phase === 'done') return 'Тренировка завершена';

        const currentInterval = timer.intervalIdx === 0 ? '' : `Интервал ${timer.intervalIdx}/${timer.cycles}`;
        const currentSet = timer.sets <= 1 ? '' : `Сет ${timer.setIdx + 1}/${timer.sets}`;

        return [currentInterval, currentSet].filter(Boolean).join(' • ');
    };

    return {
        timer,
        start,
        pause,
        reset,
        progress,
        maxValue,
        getPhaseInfo,
        formatTime,
        getProgressText
    };
}; 