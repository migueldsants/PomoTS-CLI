import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';
import chalk from 'chalk';
import type { AppSettings } from '../types/index.js';
import { DEFAULT_SETTINGS, CONFIG_FILENAME } from '../constants.js';

const CONFIG_PATH = path.join(os.homedir(), CONFIG_FILENAME);

export async function loadSettings(): Promise<AppSettings> {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf-8');
        const settings = JSON.parse(data);
        return { ...DEFAULT_SETTINGS, ...settings };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
    try {
        await fs.writeFile(
            CONFIG_PATH,
            JSON.stringify(settings, null, 2),
            'utf-8',
        );
    } catch (error) {
        console.error(chalk.red('Error saving settings:'), error);
    }
}

export async function settingsMenu(): Promise<void> {
    const currentSettings = await loadSettings();

    console.log(chalk.cyan.bold('\n  ⚙️  Current Settings\n'));
    console.log(
        `  Work Duration:              ${chalk.green.bold(String(currentSettings.workDuration))} minutes`,
    );
    console.log(
        `  Break Duration:             ${chalk.green.bold(String(currentSettings.breakDuration))} minutes`,
    );
    console.log(
        `  Long Break Duration:        ${chalk.green.bold(String(currentSettings.longBreakDuration))} minutes`,
    );
    console.log(
        `  Sessions before long break: ${chalk.green.bold(String(currentSettings.sessionsBeforeLongBreak))}\n`,
    );

    const validate = (value: number | undefined): boolean | string => {
        if (typeof value === 'number' && value > 0) return true;
        return 'Please enter a valid number greater than 0';
    };

    const answers = await inquirer.prompt([
        {
            type: 'number',
            name: 'workDuration',
            message: 'Work duration (minutes):',
            default: currentSettings.workDuration,
            validate,
        },
        {
            type: 'number',
            name: 'breakDuration',
            message: 'Break duration (minutes):',
            default: currentSettings.breakDuration,
            validate,
        },
        {
            type: 'number',
            name: 'longBreakDuration',
            message: 'Long break duration (minutes):',
            default: currentSettings.longBreakDuration,
            validate,
        },
        {
            type: 'number',
            name: 'sessionsBeforeLongBreak',
            message: 'Sessions before long break:',
            default: currentSettings.sessionsBeforeLongBreak,
            validate,
        },
    ]);

    await saveSettings({
        workDuration: answers.workDuration,
        breakDuration: answers.breakDuration,
        longBreakDuration: answers.longBreakDuration,
        sessionsBeforeLongBreak: answers.sessionsBeforeLongBreak,
    });

    console.log(chalk.green('\n  ✅ Settings saved successfully!\n'));
    await new Promise((resolve) => setTimeout(resolve, 1500));
}