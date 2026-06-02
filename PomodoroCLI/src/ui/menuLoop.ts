import chalk from 'chalk';
import inquirer from 'inquirer';
import { startPomodoro } from '../timer/pomodoro.js';
import { loadSettings, settingsMenu } from '../timer/settings.js';
import { showStats } from '../stats/history.js';
import type { MenuOption } from '../types/index.js';
import { APP_TITLE } from '../constants.js';

export async function menuLoop(): Promise<void> {
    let shouldExit = false;

    while (!shouldExit) {
        const settings = await loadSettings();

        const { option } = await inquirer.prompt<{ option: MenuOption }>([
            {
                type: 'rawlist',
                name: 'option',
                message: 'Select an option:',
                choices: [
                    { name: '🍅 Start Pomodoro', value: 'start' },
                    { name: '📊 Statistics', value: 'stats' },
                    { name: '⚙️  Settings', value: 'settings' },
                    { name: '🚪 Exit', value: 'exit' },
                ],
                pageSize: 10,
            },
        ]);

        switch (option) {
            case 'start':
                console.clear();
                await startPomodoro(settings);
                break;

            case 'stats':
                console.clear();
                console.log(chalk.green(APP_TITLE));
                await showStats();
                break;

            case 'settings':
                console.clear();
                console.log(chalk.green(APP_TITLE));
                await settingsMenu();
                break;

            case 'exit':
                shouldExit = true;
                console.log(chalk.red('\n  👋 Goodbye! Stay productive!\n'));
                break;

            default:
                console.log(chalk.red('Error: Invalid option selected.'));
                break;
        }

        if (!shouldExit) {
            console.clear();
            console.log(chalk.green(APP_TITLE));
        }
    }
}

export default menuLoop;
