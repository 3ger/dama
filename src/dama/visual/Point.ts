/**
 * Represents 2D-Coordinates
 */
export class Point {
   constructor(public x: number, public y: number) { }
   toString(): string {
      return `x:${this.x}, y:${this.y}`;
   }
}
