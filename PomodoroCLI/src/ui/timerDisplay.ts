import figlet from 'figlet';
import chalk from 'chalk';
import { FIGLET_FONT } from '../constants.js';
import type { TimerPhase } from '../types/index.js';

const PHASE_CONFIG = {
    work: { label: '🍅 Work Time', color: 'red' as const },
    break: { label: '☕ Break Time', color: 'green' as const },
    longBreak: { label: '🌴 Long Break', color: 'cyan' as const },
};

export function renderTimer(
    seconds: number,
    phase: TimerPhase,
    isPaused: boolean,
    sessionCount: number,
): void {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const config = PHASE_CONFIG[phase];

    let asciiTime: string;
    try {
        asciiTime = figlet.textSync(timeStr, { font: FIGLET_FONT });
    } catch {
        asciiTime = `  ${timeStr}`;
    }

    console.clear();
    console.log(
        chalk[config.color].bold(config.label) +
            chalk.gray(` — Session #${sessionCount}`),
    );
    console.log(chalk[config.color]('\n' + asciiTime));

    if (isPaused) {
        console.log(chalk.yellow.bold('\n  ⏸  PAUSED\n'));
    } else {
        console.log('');
    }

    console.log(chalk.gray('─'.repeat(55)));

    const toggleKey = isPaused
        ? chalk.cyan('[P] Resume ')
        : chalk.cyan('[P] Pause  ');

    const switchLabel = phase === 'work' ? 'Break' : 'Work';

    console.log(
        `  ${toggleKey} ${chalk.cyan('[R] Restart')}  ${chalk.cyan(`[B] ${switchLabel}`)}  ${chalk.red('[Q] Quit')}`,
    );
}
