export function throttle<Args extends any[], R>(time: number, f: (...args: Args) => R): (...t: Args) => R | void {
    let lastTime: number = 0;
    return function (...args: Args) {
        const now = Date.now();
        if (now - lastTime < time) {
            return;
        }
        lastTime = now;
        return f(...args);
    };
}

export function choice<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)]
}
