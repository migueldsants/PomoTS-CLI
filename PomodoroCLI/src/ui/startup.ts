import figlet from 'figlet';
import chalk from 'chalk';
import chalkAnimation from 'chalk-animation';
import { FIGLET_FONT, APP_TITLE } from '../constants.js';

const sleep = (ms: number = 2000): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

async function startup(): Promise<void> {
    console.clear();
    await titleScreen();
    await showBanner();
}

export default startup;

async function titleScreen(): Promise<void> {
    const anim = chalkAnimation.rainbow(APP_TITLE);
    await sleep();
    anim.stop();

    console.clear();
    console.log(chalk.green(APP_TITLE));
}

export function showBanner(): Promise<void> {
    return new Promise((resolve, reject) => {
        figlet.text(
            'pomots',
            { font: FIGLET_FONT },
            (err: Error | null, data?: string) => {
                if (err || !data) {
                    reject(err);
                    return;
                }
                console.log(chalk.red(data));
                resolve();
            },
        );
    });
}