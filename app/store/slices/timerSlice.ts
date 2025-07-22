import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define a type for the slice state
interface TimerState {
    // Настройки таймера
    prep: number;
    work: number;
    rest: number;
    cycles: number;
    sets: number;
    restBetweenSets: number;
    descWork: string;
    descRest: string;
    
    // Состояние выполнения
    phase: 'prep' | 'work' | 'rest' | 'restSet' | 'done';
    currentCycle: number;  // Текущий цикл (1-based)
    currentSet: number;    // Текущий сет (1-based)
    seconds: number;       // Оставшиеся секунды в текущей фазе
    running: boolean;
    auto: boolean;
    
    // Вычисляемые поля
    totalCycles: number;
    totalSets: number;
    isFinished: boolean;
}

// Create the initial state
const initialState: TimerState = {
    // Настройки по умолчанию
    prep: 2,
    work: 60,
    rest: 30,
    cycles: 8,
    sets: 1,
    restBetweenSets: 120,
    descWork: '',
    descRest: '',
    
    // Состояние выполнения
    phase: 'prep',
    currentCycle: 0,
    currentSet: 1,
    seconds: 2, // Начинаем с prep времени
    running: false,
    auto: true,
    
    // Вычисляемые поля
    totalCycles: 8,
    totalSets: 1,
    isFinished: false
};

export const timerSlice = createSlice({
    name: 'timer',
    initialState,
    reducers: {
        setPrep: (state, action: PayloadAction<number>) => {
            state.prep = action.payload;
            if (state.phase === 'prep') {
                state.seconds = action.payload;
            }
        },
        setWork: (state, action: PayloadAction<number>) => {
            state.work = action.payload;
            if (state.phase === 'work') {
                state.seconds = action.payload;
            }
        },
        setRest: (state, action: PayloadAction<number>) => {
            state.rest = action.payload;
            if (state.phase === 'rest') {
                state.seconds = action.payload;
            }
        },
        setCycles: (state, action: PayloadAction<number>) => {
            state.cycles = action.payload;
            state.totalCycles = action.payload;
        },
        setSets: (state, action: PayloadAction<number>) => {
            state.sets = action.payload;
            state.totalSets = action.payload;
        },
        setRestBetweenSets: (state, action: PayloadAction<number>) => {
            state.restBetweenSets = action.payload;
            if (state.phase === 'restSet') {
                state.seconds = action.payload;
            }
        },
        setDescWork: (state, action: PayloadAction<string>) => {
            state.descWork = action.payload;
        },
        setDescRest: (state, action: PayloadAction<string>) => {
            state.descRest = action.payload;
        },
        startTimer: (state) => {
            state.running = true;
        },
        pauseTimer: (state) => {
            state.running = false;
        },
        resetTimer: (state) => {
            state.phase = 'prep';
            state.currentCycle = 0;
            state.currentSet = 1;
            state.seconds = state.prep;
            state.running = false;
            state.isFinished = false;
        },
        toggleAuto: (state) => {
            state.auto = !state.auto;
        },
        decrementSeconds: (state) => {
            if (state.seconds > 0) {
                state.seconds = state.seconds - 1;
            }
        },
        nextPhase: (state) => {
            console.log(`🔄 Переход из фазы ${state.phase}, цикл ${state.currentCycle}/${state.cycles}, сет ${state.currentSet}/${state.sets}`);
            
            if (state.phase === 'prep') {
                // Из подготовки переходим к работе
                state.phase = 'work';
                state.seconds = state.work;
                state.currentCycle = 1;
                console.log('✅ Переход: prep → work');
                
            } else if (state.phase === 'work') {
                // Из работы переходим к отдыху или к следующему сету/завершению
                if (state.currentCycle < state.cycles) {
                    // Еще есть циклы в текущем сете
                    state.phase = 'rest';
                    state.seconds = state.rest;
                    console.log('✅ Переход: work → rest');
                } else {
                    // Закончили все циклы в сете
                    if (state.currentSet < state.sets) {
                        // Переходим к отдыху между сетами
                        state.phase = 'restSet';
                        state.seconds = state.restBetweenSets;
                        console.log('✅ Переход: work → restSet');
                    } else {
                        // Все сеты завершены
                        state.phase = 'done';
                        state.running = false;
                        state.isFinished = true;
                        console.log('✅ Переход: work → done (тренировка завершена)');
                    }
                }
                
            } else if (state.phase === 'rest') {
                // Из отдыха переходим к следующему циклу работы
                state.phase = 'work';
                state.seconds = state.work;
                state.currentCycle = state.currentCycle + 1;
                console.log('✅ Переход: rest → work');
                
            } else if (state.phase === 'restSet') {
                // Из отдыха между сетами переходим к новому сету
                state.currentSet = state.currentSet + 1;
                state.currentCycle = 1;
                state.phase = 'work';
                state.seconds = state.work;
                console.log('✅ Переход: restSet → work (новый сет)');
            }
            
            console.log(`📊 Новое состояние: фаза=${state.phase}, цикл=${state.currentCycle}/${state.cycles}, сет=${state.currentSet}/${state.sets}, секунды=${state.seconds}`);
        },
        
        // Установка полной конфигурации (для загрузки из URL params)
        setTimerConfig: (state, action: PayloadAction<{
            prep?: number;
            work?: number;
            rest?: number;
            cycles?: number;
            sets?: number;
            restBetweenSets?: number;
            descWork?: string;
            descRest?: string;
        }>) => {
            const config = action.payload;
            
            if (config.prep !== undefined) state.prep = config.prep;
            if (config.work !== undefined) state.work = config.work;
            if (config.rest !== undefined) state.rest = config.rest;
            if (config.cycles !== undefined) {
                state.cycles = config.cycles;
                state.totalCycles = config.cycles;
            }
            if (config.sets !== undefined) {
                state.sets = config.sets;
                state.totalSets = config.sets;
            }
            if (config.restBetweenSets !== undefined) state.restBetweenSets = config.restBetweenSets;
            if (config.descWork !== undefined) state.descWork = config.descWork;
            if (config.descRest !== undefined) state.descRest = config.descRest;
            
            // Сбрасываем таймер после изменения конфигурации
            state.phase = 'prep';
            state.currentCycle = 0;
            state.currentSet = 1;
            state.seconds = state.prep;
            state.running = false;
            state.isFinished = false;
            
            console.log('🔧 Конфигурация таймера обновлена:', config);
        }
    }
});

export const {
    setPrep,
    setWork,
    setRest,
    setCycles,
    setSets,
    setRestBetweenSets,
    setDescWork,
    setDescRest,
    startTimer,
    pauseTimer,
    resetTimer,
    toggleAuto,
    decrementSeconds,
    nextPhase,
    setTimerConfig
} = timerSlice.actions;

export default timerSlice.reducer; 