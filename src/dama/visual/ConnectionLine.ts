import { OutputNudge } from "./OutputNudge";
import { InputNudge } from "./InputNudge";
import { GraphItem } from "./GraphItem";
import { Point } from "./Point";
import { GraphColor } from "./GraphColor";

export class ConnectionLine extends PIXI.Graphics implements GraphItem {
   private toPos: Point;
   constructor(private readonly from: OutputNudge, private to?: InputNudge) {
      super();
      this.redraw();
   }
   setToPos(toPos: Point): ConnectionLine {
      this.toPos = toPos;
      return this;
   }
   getGraphItem(parent?: PIXI.Container): PIXI.DisplayObject {
      this.redraw();
      return this;
   }
   redraw(): void {
      this.clear();
      let posStart = this.from.getGlobalPosition();
      let posEnd = this.to ? this.to.getGlobalPosition() : this.toPos || posStart;
      if (this.parent) {
         let pTransform = (this.parent as Viewport).toWorld(posStart.x, posStart.y);
         posStart.x = pTransform.x;
         posStart.y = pTransform.y;
         pTransform = (this.parent as Viewport).toWorld(posEnd.x, posEnd.y);
         posEnd.x = pTransform.x;
         posEnd.y = pTransform.y;
      }
      this.lineStyle(4, GraphColor.Connection);
      this.moveTo(posStart.x, posStart.y);
      this.lineTo(posEnd.x, posEnd.y);
   }
}
