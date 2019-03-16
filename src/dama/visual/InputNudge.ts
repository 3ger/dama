import { GraphColor } from "./GraphColor";
import { GraphItem } from "./GraphItem";

/**
 * Input nudge graph element
 */
export class InputNudge extends PIXI.Graphics implements GraphItem {

   constructor(public isActive: boolean = false) {
      super();
   }

   getGraphItem(parent?: PIXI.Container): PIXI.DisplayObject {
      this.redraw();
      return this;
   }

   redraw(): void {
      this.clear()
         .beginFill(this.isActive ? GraphColor.InputNudgeActive : GraphColor.InputNudge)
         .lineStyle(1, 0x0)
         .arc(0, 0, 13, Math.PI, Math.PI * 2);
      this.rotation = (Math.PI * -1.5);
      this.x = 1.5;
      this.y = 16;
   }
}
