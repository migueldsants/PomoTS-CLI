export class Cronometer {
    private seconds: number;
    private intervalId?: ReturnType<typeof setInterval>;
    private onTick: (seconds: number) => void;

    constructor(duration: number, onTick: (seconds: number) => void) {
        this.seconds = duration;
        this.onTick = onTick;
    }

    start(): void {
        if (this.intervalId) return;
        this.intervalId = setInterval(() => {
            this.seconds--;
            this.onTick(this.seconds);
            if (this.seconds <= 0) {
                this.pause();
            }
        }, 1000);
    }

    pause(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }

    reset(newDuration: number): void {
        this.pause();
        this.seconds = newDuration;
        this.onTick(this.seconds);
    }

    getTime(): number {
        return this.seconds;
    }

    isRunning(): boolean {
        return this.intervalId !== undefined;
    }

    destroy(): void {
        this.pause();
        this.onTick = () => {};
    }
}