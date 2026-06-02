import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Cronometer } from '../timer/cronometer.js';

describe('Cronometer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initialize with the given duration', () => {
        const onTick = vi.fn();
        const cronometer = new Cronometer(60, onTick);

        expect(cronometer.getTime()).toBe(60);
        expect(cronometer.isRunning()).toBe(false);

        cronometer.destroy();
    });

    it('should tick down every second', () => {
        const onTick = vi.fn();
        const cronometer = new Cronometer(10, onTick);
        cronometer.start();

        expect(cronometer.isRunning()).toBe(true);

        vi.advanceTimersByTime(3000);

        expect(onTick).toHaveBeenCalledTimes(3);
        expect(cronometer.getTime()).toBe(7);

        cronometer.destroy();
    });

    it('should pause and resume correctly', () => {
        const onTick = vi.fn();
        const cronometer = new Cronometer(10, onTick);
        cronometer.start();

        vi.advanceTimersByTime(2000);
        expect(cronometer.getTime()).toBe(8);

        cronometer.pause();
        expect(cronometer.isRunning()).toBe(false);

        // Time passes while paused — timer should not change
        vi.advanceTimersByTime(5000);
        expect(cronometer.getTime()).toBe(8);

        cronometer.start();
        vi.advanceTimersByTime(2000);
        expect(cronometer.getTime()).toBe(6);

        cronometer.destroy();
    });

    it('should reset to a new duration', () => {
        const onTick = vi.fn();
        const cronometer = new Cronometer(10, onTick);
        cronometer.start();

        vi.advanceTimersByTime(3000);
        cronometer.reset(20);

        expect(cronometer.getTime()).toBe(20);
        expect(cronometer.isRunning()).toBe(false);
        // onTick is called with the new duration on reset
        expect(onTick).toHaveBeenLastCalledWith(20);

        cronometer.destroy();
    });

    it('should auto-stop at zero', () => {
        const onTick = vi.fn();
        const cronometer = new Cronometer(3, onTick);
        cronometer.start();

        vi.advanceTimersByTime(5000);

        expect(cronometer.getTime()).toBe(0);
        expect(cronometer.isRunning()).toBe(false);

        cronometer.destroy();
    });

    it('should not start a second interval if already running', () => {
        const onTick = vi.fn();
        const cronometer = new Cronometer(10, onTick);
        cronometer.start();
        cronometer.start(); // no-op

        vi.advanceTimersByTime(2000);
        // Only 2 ticks, not 4
        expect(onTick).toHaveBeenCalledTimes(2);

        cronometer.destroy();
    });

    it('should suppress ticks after destroy', () => {
        const onTick = vi.fn();
        const cronometer = new Cronometer(10, onTick);
        cronometer.start();

        vi.advanceTimersByTime(2000);
        cronometer.destroy();

        // After destroy, further ticks should not call the original onTick
        vi.advanceTimersByTime(5000);
        expect(onTick).toHaveBeenCalledTimes(2);
    });
});
