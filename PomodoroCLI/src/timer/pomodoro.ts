import readline from 'readline';
import { Cronometer } from './cronometer.js';
import { renderTimer } from '../ui/timerDisplay.js';
import { addRecord } from '../stats/history.js';
import type { AppSettings, TimerPhase } from '../types/index.js';

let keypressInitialized = false;

export async function startPomodoro(settings: AppSettings): Promise<void> {
    let phase: TimerPhase = 'work';
    let isPaused = false;
    let completedWorkSessions = 0;
    let currentDuration = settings.workDuration * 60;

    const cronometer = new Cronometer(currentDuration, (seconds: number) => {
        renderTimer(seconds, phase, isPaused, completedWorkSessions + 1);

        if (seconds <= 0 && !isPaused) {
            // 🔔 Audible notification
            process.stdout.write('\x07');

            // Record completed session
            addRecord({
                type: phase,
                duration: currentDuration,
                completedAt: new Date().toISOString(),
            });

            // Transition to next phase
            if (phase === 'work') {
                completedWorkSessions++;
                if (
                    completedWorkSessions % settings.sessionsBeforeLongBreak ===
                    0
                ) {
                    phase = 'longBreak';
                    currentDuration = settings.longBreakDuration * 60;
                } else {
                    phase = 'break';
                    currentDuration = settings.breakDuration * 60;
                }
            } else {
                phase = 'work';
                currentDuration = settings.workDuration * 60;
            }

            cronometer.reset(currentDuration);
            cronometer.start();
        }
    });

    // Initial render + start
    renderTimer(currentDuration, phase, isPaused, completedWorkSessions + 1);
    cronometer.start();

    return new Promise<void>((resolve) => {
        // Only initialize keypress events once to avoid duplicate listeners
        if (!keypressInitialized) {
            readline.emitKeypressEvents(process.stdin);
            keypressInitialized = true;
        }

        if (process.stdin.isTTY) process.stdin.setRawMode(true);
        process.stdin.resume();

        const onKeypress = (
            _str: string | undefined,
            key: readline.Key,
        ): void => {
            if (!key) return;

            // Quit
            if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
                cleanup();
                resolve();
                return;
            }

            switch (key.name) {
                // Pause / Resume toggle
                case 'p':
                case 'space':
                    isPaused = !isPaused;
                    if (isPaused) {
                        cronometer.pause();
                    } else {
                        cronometer.start();
                    }
                    renderTimer(
                        cronometer.getTime(),
                        phase,
                        isPaused,
                        completedWorkSessions + 1,
                    );
                    break;

                // Restart current phase
                case 'r':
                    cronometer.reset(currentDuration);
                    cronometer.start();
                    isPaused = false;
                    break;

                // Toggle work ↔ break
                case 'b':
                    if (phase === 'work') {
                        phase = 'break';
                        currentDuration = settings.breakDuration * 60;
                    } else {
                        phase = 'work';
                        currentDuration = settings.workDuration * 60;
                    }
                    cronometer.reset(currentDuration);
                    cronometer.start();
                    isPaused = false;
                    break;
            }
        };

        process.stdin.on('keypress', onKeypress);

        function cleanup(): void {
            process.stdin.removeListener('keypress', onKeypress);
            if (process.stdin.isTTY) process.stdin.setRawMode(false);
            cronometer.destroy();
            console.clear();
        }
    });
}
