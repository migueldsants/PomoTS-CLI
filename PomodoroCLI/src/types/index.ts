export interface AppSettings {
    workDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    sessionsBeforeLongBreak: number;
}

export interface SessionRecord {
    type: TimerPhase;
    duration: number;
    completedAt: string;
}

export type TimerPhase = 'work' | 'break' | 'longBreak';
export type TimerResult = 'back';
export type MenuOption = 'start' | 'settings' | 'stats' | 'exit';
