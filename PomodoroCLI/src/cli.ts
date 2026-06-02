import { Command } from 'commander';

export interface CliOptions {
    work?: number;
    break?: number;
    longBreak?: number;
    start?: boolean;
    stats?: boolean;
}

export function parseCli(): CliOptions {
    const program = new Command();

    program
        .name('pomots')
        .description('🍅 A CLI Pomodoro Timer built with TypeScript')
        .version('3.0.0')
        .option('-w, --work <minutes>', 'work duration in minutes (use with --start)', parseInt)
        .option('-b, --break <minutes>', 'break duration in minutes (use with --start)', parseInt)
        .option(
            '-l, --long-break <minutes>',
            'long break duration in minutes (use with --start)',
            parseInt,
        )
        .option('-s, --start', 'start pomodoro immediately (skip menu)')
        .option('--stats', 'show session statistics')
        .parse();

    return program.opts<CliOptions>();
}
