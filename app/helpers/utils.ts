export const blank8x1Row   = [0, 0, 0, 0, 0, 0, 0, 0];
export const blank16x16Row = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

export const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const gcd = (a: number, b: number): number => b == 0 ? a : gcd(b, a % b);


/**
 * Computer the Lowest Common Multiple (LCM) using the Greatest Common Divisor
 *
 *                   |b|
 * lcm(a, b) = |a| ---------
 *                 gcd(a, b)
 *
 * @param a first integer
 * @param b second integer
 * @returns the lowest common multiple of both integers
 */
export const lcm = (a: number, b: number): number => {
  // Avoid divide by 0
  if (a == 0 && b == 0) return 0;

  return Math.abs(a) * (Math.abs(b) / gcd(a, b));
}


export const debounce = (callback: Function, wait: number) => {
  let timeoutId: NodeJS.Timeout = null;

  return (...args: any[]) => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      callback.apply(null, args);
    }, wait);
  }
}


/**
 * Scale a number from its normal low-to-high range to a new low-to-high range (e.g., mapping 0-127 to 0-1 or vice versa)
 *
 * @param num number to scale
 * @param inputRange low/high range for the input number
 * @param outputRange low/high range to map the input number to
 * @returns number scaled to output range
 */
export const scaleToRange = ( num: number, inputRange: number[], outputRange: number[] ) => {
  return (num - inputRange[0]) * (outputRange[1] - outputRange[0]) / (inputRange[1] - inputRange[0]) + outputRange[0];
}
