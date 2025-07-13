import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define a type for the slice state
interface TimerState {
    prep: number;
    work: number;
    rest: number;
    cycles: number;
    sets: number;
    restBetweenSets: number;
    descWork: string;
    descRest: string;
    phase: 'prep' | 'work' | 'rest' | 'restSet' | 'done';
    intervalIdx: number;
    setIdx: number;
    seconds: number;
    running: boolean;
    auto: boolean;
    totalIntervals: number;
}

// Create the initial state
const initialState: TimerState = {
    prep: 2,
    work: 60,
    rest: 0,
    cycles: 8,
    sets: 1,
    restBetweenSets: 0,
    descWork: '',
    descRest: '',
    phase: 'prep',
    intervalIdx: 0,
    setIdx: 0,
    seconds: 2, // Initial seconds based on prep time
    running: false,
    auto: true,
    totalIntervals: 8 // Initial calculation
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
            state.totalIntervals = state.sets * action.payload + state.sets - 1;
        },
        setSets: (state, action: PayloadAction<number>) => {
            state.sets = action.payload;
            state.totalIntervals = action.payload * state.cycles + action.payload - 1;
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
            state.intervalIdx = 0;
            state.setIdx = 0;
            state.seconds = state.prep;
            state.running = false;
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
            if (state.phase === 'prep') {
                state.phase = 'work';
                state.seconds = state.work;
                state.intervalIdx = 1;
            } else if (state.phase === 'work') {
                if (state.cycles > 1 && state.intervalIdx < state.cycles) {
                    state.phase = 'rest';
                    state.seconds = state.rest;
                } else if (state.setIdx < state.sets - 1) {
                    state.phase = 'restSet';
                    state.seconds = state.restBetweenSets;
                } else {
                    state.phase = 'done';
                    state.running = false;
                }
                state.intervalIdx = state.intervalIdx + 1;
            } else if (state.phase === 'rest') {
                state.phase = 'work';
                state.seconds = state.work;
            } else if (state.phase === 'restSet') {
                state.setIdx = state.setIdx + 1;
                state.intervalIdx = 1;
                state.phase = 'work';
                state.seconds = state.work;
            }
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
    nextPhase
} = timerSlice.actions;

export default timerSlice.reducer; 