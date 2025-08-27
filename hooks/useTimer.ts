import { useAppSelector } from '../store/hooks';
import type { RootState } from '../store';
import type { TimerState } from '../store/slices/timerSlice';

export const useTimer = () => {
    const timer = useAppSelector((state: RootState) => state.timer) as TimerState;

    // ❌ УБИРАЕМ useEffect с интервалом - логика таймера только в компонентах

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

        const currentInterval = timer.currentCycle === 0 ? '' : `Интервал ${timer.currentCycle}/${timer.cycles}`;
        const currentSet = timer.sets <= 1 ? '' : `Сет ${timer.currentSet}/${timer.sets}`;

        return [currentInterval, currentSet].filter(Boolean).join(' • ');
    };

    return {
        timer,
        progress,
        maxValue,
        getPhaseInfo,
        formatTime,
        getProgressText
    };
}; 