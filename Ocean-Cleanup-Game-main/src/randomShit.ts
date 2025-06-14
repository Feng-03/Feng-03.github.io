/**
 * Distance between two cartesian points using pythagorean theorems.
 * @param x1 X coordinate of first point
 * @param y1 Y coordinate of first point
 * @param x2 X coordinate of second point
 * @param y2 Y coordinate of second point
 * @returns Distance
 */
export function dist(x1: number, y1: number, x2: number, y2: number) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Angle between two radian points. May handle negatives. Will not handle coterminal angles.
 * @param one First radian angle
 * @param two Second radian angle
 * @returns Possibly negative difference in radians
 */
export function angleDiff(one: number, two: number) {
    // dont ask me what this is
    return mod((one - two) + Math.PI, 2 * Math.PI) - Math.PI;
}

export function playAudio(src: string) {
    const audioElem = createElem("audio", {src: src}) as HTMLAudioElement;
    audioElem.play();
    audioElem.remove();
}

/**
 * Bound a number between min and max
 * @value value to bound
 * @min minimum
 * @max maximum
 * @return bounded value
 */
export function bound(value: number, min: number, max: number) {
    return Math.max(Math.min(value, max), min);
}

/**
 * Polar coordinates to cartesian coordinates
 * @param r Radius
 * @param theta Angle in radians, including coterminal
 * @returns Cartesian [x, y]
 */
export function polarToCartesian(radius: number, rotation: number): [number, number] {
    return [Math.cos(rotation) * radius, Math.sin(rotation) * radius];
}

export function scaleVector(x: number, y: number, length: number): [number, number] {
    const distance = dist(0, 0, x, y);
    x = x / distance * length;
    y = y / distance * length;
    return [x, y];
}

/**
 * Modulus. Like remainder but also for negative numbers.
 * mod(420, 69) = 6; mod(-69, 420) = 351;
 * @param num Dividend
 * @param divisor Divisor
 * @returns Mod
 */
export function mod(num: number, divisor: number) {
    return ((num % divisor) + divisor) % divisor;
}

/**
 * Create an element but stupid
 * @param type Type of element
 * @param properties Element properties set using regular object properties
 * @param children List of element's childrens, added with appendChild
 * @return Element
 */
export function createElem(type: string, properties = {}, styles = {}, ...children: Node[]) {
    const elem = document.createElement(type);
    Object.assign(elem, properties);
    Object.assign(elem.style, styles);
    for (const child of children) {
        elem.appendChild(child);
    }
    return elem;
}