import type { AppSettings } from './types/index.js';

export const DEFAULT_SETTINGS: AppSettings = {
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
};

export const FIGLET_FONT = 'ANSI Shadow';
export const APP_TITLE = '🍅 Pomodoro CLI\n';
export const CONFIG_FILENAME = '.pomots-config.json';
export const HISTORY_FILENAME = '.pomots-history.json';
