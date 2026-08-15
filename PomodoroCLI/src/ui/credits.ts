import chalk from 'chalk';
import readline from 'readline';

// ─── Rendering constants ──────────────────────────────────────────
const SHADE = '.,:;+*?%S#@';

interface SurfacePoint {
    x: number;
    y: number;
    z: number;
    nx: number;
    ny: number;
    nz: number;
    isLeaf: boolean;
}

// ─── Tomato body ──────────────────────────────────────────────────
//
//  Implicit surface:
//    (x² + y² + z²)² − 2a²(x² − y² − z²) = b⁴ − a⁴
//
//  Solved in spherical coords (θ = polar, φ = azimuthal):
//    Let u = sin²θ · cos(2φ) − cos²θ
//    Then r²(θ,φ) = a²u + √(a⁴u² + b⁴ − a⁴)
//
//  Surface normal from gradient ∇F:
//    ∂F/∂x = 4x(r² − a²)
//    ∂F/∂y = 4y(r² + a²)
//    ∂F/∂z = 4z(r² + a²)
//
//  Roundness:
//    x_radius = √(a² + b²),  y_radius = z_radius = √(b² − a²)
//    Smaller A → closer to a sphere (rounder). A = 0.6 was 1.46:1
//    oblate; A = 0.3 gives ~1.09:1, nicely round but still tomato-ish.
//
const A = 0.3;
const B = 1.0;
const A2 = A * A;
const A4 = A2 * A2;
const B4 = B ** 4;

function generateTomatoPoints(): SurfacePoint[] {
    const points: SurfacePoint[] = [];
    const THETA_STEPS = 140;
    const PHI_STEPS = 200;

    for (let i = 1; i < THETA_STEPS; i++) {
        const theta = (Math.PI * i) / THETA_STEPS;
        const sinT = Math.sin(theta);
        const cosT = Math.cos(theta);

        for (let j = 0; j < PHI_STEPS; j++) {
            const phi = (2 * Math.PI * j) / PHI_STEPS;

            // u(θ,φ) for the parametric solution
            const u = sinT * sinT * Math.cos(2 * phi) - cosT * cosT;
            const disc = A4 * u * u + B4 - A4;
            if (disc < 0) continue;

            const r2 = A2 * u + Math.sqrt(disc);
            if (r2 <= 0) continue;

            const r = Math.sqrt(r2);
            const x = r * sinT * Math.cos(phi);
            const y = r * cosT;
            const z = r * sinT * Math.sin(phi);

            // Gradient for surface normal
            const s = x * x + y * y + z * z;
            const gx = 4 * x * (s - A2);
            const gy = 4 * y * (s + A2);
            const gz = 4 * z * (s + A2);
            const gl = Math.hypot(gx, gy, gz) || 1;

            points.push({
                x,
                y,
                z,
                nx: gx / gl,
                ny: gy / gl,
                nz: gz / gl,
                isLeaf: false,
            });
        }
    }

    return points;
}

// ─── Leaves (calyx) ───────────────────────────────────────────────
//
//  Rhodonea (rose) curve:  ρ(φ) = cos(5φ)
//
//  Extended to 3D calyx surface parametrically:
//    r(φ,t) = R₀ + t · L · cos(5φ) · (1−t)
//    y(φ,t) = y_top + t · H · (1 − 0.3t)
//
//  Where φ = azimuthal angle, t ∈ [0,1] along each leaf.
//  cos(5φ) produces 5 symmetric lobes (petals).
//
function generateLeafPoints(topY: number): SurfacePoint[] {
    const points: SurfacePoint[] = [];
    const LEAF_LENGTH = 0.55;
    const LEAF_HEIGHT = 0.45;
    const BASE_R = 0.15;

    // Calyx lobes
    for (let phi = 0; phi < 2 * Math.PI; phi += 0.012) {
        const rose = Math.cos(5 * phi);
        if (rose <= 0.05) continue; // Only positive lobes → 5 leaves

        for (let t = 0; t <= 1; t += 0.025) {
            const rho = BASE_R + t * LEAF_LENGTH * rose * Math.pow(1 - t, 1.0);
            const y = topY + t * LEAF_HEIGHT * (1 - 0.3 * t);
            const x = rho * Math.cos(phi);
            const z = rho * Math.sin(phi);

            // Approximate outward-up normal
            const nl = Math.hypot(Math.cos(phi), 1.6, Math.sin(phi));
            points.push({
                x,
                y,
                z,
                nx: Math.cos(phi) / nl,
                ny: 1.6 / nl,
                nz: Math.sin(phi) / nl,
                isLeaf: true,
            });
        }
    }

    // Small stem at the very top
    for (let t = 0; t <= 1; t += 0.04) {
        const sy = topY + 0.1 + t * 0.25;
        const sr = 0.04 * (1 - t * 0.5);
        for (let p = 0; p < 2 * Math.PI; p += 0.4) {
            points.push({
                x: sr * Math.cos(p),
                y: sy,
                z: sr * Math.sin(p),
                nx: Math.cos(p),
                ny: 0,
                nz: Math.sin(p),
                isLeaf: true,
            });
        }
    }

    return points;
}

// ─── Frame renderer ───────────────────────────────────────────────
function renderFrame(
    points: SurfacePoint[],
    angleY: number,
    W: number,
    H: number,
    tiltX = 0.35,
): string {
    const size = W * H;
    const outBuf = new Array<string>(size).fill(' ');
    const zBuf = new Float64Array(size).fill(-1e9);
    const leafBuf = new Uint8Array(size);

    // Y-axis rotation (animated)
    const cY = Math.cos(angleY);
    const sY = Math.sin(angleY);

    // X-axis tilt (~20° baseline) so we see the top leaves; passed in so the
    // credits screen can breathe/nod it for a more curious motion.
    const cX = Math.cos(tiltX);
    const sX = Math.sin(tiltX);

    // Light direction (normalized)
    const lx = 0.19,
        ly = 0.39,
        lz = -0.9;

    const scale = Math.min(W / 2.8, H / 1.5);
    const cx = W / 2;
    const cy = H / 2;

    for (let i = 0; i < points.length; i++) {
        const p = points[i];

        // Rotate around Y
        let rx = p.x * cY + p.z * sY;
        let ry = p.y;
        let rz = -p.x * sY + p.z * cY;

        // Tilt around X
        const ry2 = ry * cX - rz * sX;
        rz = ry * sX + rz * cX;
        ry = ry2;

        // Rotate normals
        let nx = p.nx * cY + p.nz * sY;
        let ny = p.ny;
        let nz = -p.nx * sY + p.nz * cY;
        const ny2 = ny * cX - nz * sX;
        nz = ny * sX + nz * cX;
        ny = ny2;

        // Perspective projection
        const pf = 5 / (5 + rz);
        const sx = Math.round(rx * scale * pf + cx);
        const sy = Math.round(-ry * scale * pf * 0.55 + cy);
        if (sx < 0 || sx >= W || sy < 0 || sy >= H) continue;

        const idx = sy * W + sx;
        if (rz <= zBuf[idx]) continue;
        zBuf[idx] = rz;

        // Lighting (dot product with light dir)
        const dot = nx * lx + ny * ly + nz * lz;
        const brightness = Math.max(0.05, (dot + 1) / 2);
        const ci = Math.min(SHADE.length - 1, (brightness * SHADE.length) | 0);
        outBuf[idx] = SHADE[ci];
        leafBuf[idx] = p.isLeaf ? 1 : 0;
    }

    // Build output with ANSI colors (batched for performance)
    const lines: string[] = [];
    for (let row = 0; row < H; row++) {
        let line = '';
        let color = 0; // 0=none, 1=red, 2=green
        const base = row * W;
        for (let col = 0; col < W; col++) {
            const ch = outBuf[base + col];
            if (ch === ' ') {
                if (color) {
                    line += '\x1B[0m';
                    color = 0;
                }
                line += ' ';
            } else {
                const want = leafBuf[base + col] ? 2 : 1;
                if (want !== color) {
                    if (color) line += '\x1B[0m';
                    line += want === 1 ? '\x1B[91m' : '\x1B[92m';
                    color = want;
                }
                line += ch;
            }
        }
        if (color) line += '\x1B[0m';
        lines.push(line);
    }

    return lines.join('\n');
}

// ─── Credits screen ───────────────────────────────────────────────
export async function showCredits(): Promise<void> {
    // Pre-compute all surface points (done once)
    const tomato = generateTomatoPoints();
    const topY = tomato.reduce((max, p) => Math.max(max, p.y), -Infinity);
    const leaves = generateLeafPoints(topY);
    const allPoints = [...tomato, ...leaves];

    let angle = 0;
    let tick = 0;

    const creditsText = [
        '',
        chalk.yellow.bold('  🍅 PomoTS-CLI v4.0.0'),
        chalk.cyan.bold('  made by migueldsants'),
        '',
        chalk.gray('  Tomato  (x²+y²+z²)² − 2a²(x²−y²−z²) = b⁴ − a⁴'),
        chalk.gray('  Leaves  ρ(φ) = cos(5φ)  — rhodonea curve'),
        '',
        chalk.dim('  Press any key to go back...'),
    ].join('\n');

    return new Promise<void>((resolve) => {
        const intervalId = setInterval(() => {
            // Read the terminal size every frame so the tomato scales live
            // with the window — including resizes mid-animation. The renderer
            // derives its scale from W/H, so a fresh read is all it takes.
            const W = process.stdout.columns || 80;
            const H = (process.stdout.rows || 35) - 8;

            // Curious Y-axis spin: angular velocity breathes through two
            // overlapping sines, so the tomato speeds up, slows down and
            // occasionally drifts gently backward — never a flat constant turn.
            const omega =
                0.05 +
                0.035 * Math.sin(tick * 0.6) +
                0.02 * Math.sin(tick * 0.17 + 1.3);
            angle += omega;

            // Slow nodding tilt so the whole body breathes while it turns,
            // giving a more complex, precession-like motion.
            const tiltX = 0.35 + 0.12 * Math.sin(tick * 0.13);
            tick += 1;

            const frame = renderFrame(allPoints, angle, W, H, tiltX);
            process.stdout.write('\x1B[2J\x1B[H' + frame + '\n' + creditsText);
        }, 50);

        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) process.stdin.setRawMode(true);
        process.stdin.resume();

        const onKeypress = (_s: string, key: readline.Key): void => {
            if (!key) return;
            cleanup();
            if (key.ctrl && key.name === 'c') process.exit(0);
            resolve();
        };

        process.stdin.on('keypress', onKeypress);

        function cleanup(): void {
            clearInterval(intervalId);
            process.stdin.removeListener('keypress', onKeypress);
            if (process.stdin.isTTY) process.stdin.setRawMode(false);
            console.clear();
        }
    });
}