#!/usr/bin/env node

import chalk from 'chalk';
import { parseCli } from './cli.js';
import { loadSettings } from './timer/settings.js';
import { startPomodoro } from './timer/pomodoro.js';
import { showStats } from './stats/history.js';
import menuLoop from './ui/menuLoop.js';
import startup from './ui/startup.js';
import { APP_TITLE } from './constants.js';

async function main(): Promise<void> {
    const options = parseCli();

    // --stats: show statistics and exit
    if (options.stats) {
        console.clear();
        console.log(chalk.green(APP_TITLE));
        await showStats();
        return;
    }

    // --start: skip menu, start immediately with optional overrides
    if (options.start) {
        const savedSettings = await loadSettings();
        const settings = {
            ...savedSettings,
            ...(options.work !== undefined && { workDuration: options.work }),
            ...(options.break !== undefined && {
                breakDuration: options.break,
            }),
            ...(options.longBreak !== undefined && {
                longBreakDuration: options.longBreak,
            }),
        };
        console.clear();
        await startPomodoro(settings);
        return;
    }

    // Default: interactive mode
    console.clear();
    await startup();
    await menuLoop();
}

main();