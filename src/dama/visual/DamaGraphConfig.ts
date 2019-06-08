import { Point } from "./Point";

/**
 * Used to pass in config to Graph
 */
export interface DamaGraphConfig {
   size?: Point;
   workspaceSize?: Point;
   backgroundColor?: number;
   viewCanvas?: HTMLCanvasElement;
   autoSize?: boolean;
}
