import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import type { SessionRecord } from '../types/index.js';
import { HISTORY_FILENAME } from '../constants.js';

const HISTORY_PATH = path.join(os.homedir(), HISTORY_FILENAME);

interface HistoryData {
    records: SessionRecord[];
}

export async function loadHistory(): Promise<HistoryData> {
    try {
        const data = await fs.readFile(HISTORY_PATH, 'utf-8');
        return JSON.parse(data);
    } catch {
        return { records: [] };
    }
}

async function saveHistory(history: HistoryData): Promise<void> {
    await fs.writeFile(HISTORY_PATH, JSON.stringify(history, null, 2), 'utf-8');
}

export async function addRecord(record: SessionRecord): Promise<void> {
    const history = await loadHistory();
    history.records.push(record);
    await saveHistory(history);
}

export async function showStats(): Promise<void> {
    const history = await loadHistory();
    const workRecords = history.records.filter((r) => r.type === 'work');

    const totalSessions = workRecords.length;
    const totalMinutes = workRecords.reduce((acc, r) => acc + r.duration / 60, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = Math.round(totalMinutes % 60);

    // Today
    const today = new Date().toDateString();
    const todayRecords = workRecords.filter(
        (r) => new Date(r.completedAt).toDateString() === today,
    );
    const todaySessions = todayRecords.length;
    const todayMinutes = Math.round(
        todayRecords.reduce((acc, r) => acc + r.duration / 60, 0),
    );

    // This week
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekRecords = workRecords.filter(
        (r) => new Date(r.completedAt) >= weekStart,
    );
    const weekSessions = weekRecords.length;
    const weekMinutes = Math.round(
        weekRecords.reduce((acc, r) => acc + r.duration / 60, 0),
    );

    console.log(chalk.cyan.bold('\n  📊 Statistics'));
    console.log(chalk.gray('  ' + '─'.repeat(40)));

    if (totalSessions === 0) {
        console.log(
            chalk.yellow(
                '\n  No sessions recorded yet. Start your first pomodoro!\n',
            ),
        );
    } else {
        console.log(
            `  ${chalk.white('Total sessions:')}   ${chalk.green.bold(String(totalSessions))}`,
        );
        console.log(
            `  ${chalk.white('Total focus time:')} ${chalk.green.bold(`${totalHours}h ${remainingMinutes}m`)}`,
        );
        console.log('');
        console.log(
            `  ${chalk.white('Today:')}            ${chalk.yellow.bold(`${todaySessions} sessions`)} ${chalk.gray(`(${todayMinutes}m)`)}`,
        );
        console.log(
            `  ${chalk.white('This week:')}        ${chalk.yellow.bold(`${weekSessions} sessions`)} ${chalk.gray(`(${Math.floor(weekMinutes / 60)}h ${weekMinutes % 60}m)`)}`,
        );
    }

    console.log(chalk.gray('  ' + '─'.repeat(40)));
    console.log('');

    await new Promise((resolve) => setTimeout(resolve, 3000));
}
