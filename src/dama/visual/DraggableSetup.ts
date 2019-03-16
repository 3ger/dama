import { Point } from "./Point";

export class DraggableSetup {
   private isDragging: boolean = false;
   private dragData: PIXI.interaction.InteractionEvent;
   private dragStart: Point;
   private moveListeners: Array<() => void> = [];

   constructor(private readonly element: PIXI.DisplayObject) {
      element.interactive = true;
      element.on("mousedown", this.onDragStart, this);
      element.on("touchstart", this.onDragStart, this);
      element.on("pointerdown", this.onDragStart, this);
      element.on("mouseup", this.onDragEnd, this);
      element.on("mouseupoutside", this.onDragEnd, this);
      element.on("touchend", this.onDragEnd, this);
      element.on("touchendoutside", this.onDragEnd, this);
      element.on("pointerup", this.onDragEnd, this);
      element.on("mousemove", this.onPointerMove, this);
      element.on("pointermove", this.onPointerMove, this);
   }

   private onPointerMove(e: PIXI.interaction.InteractionEvent) {
      if (this.isDragging) {
         let newPosition = this.dragData.data.getLocalPosition(this.element.parent);
         this.element.x = newPosition.x - this.dragStart.x;
         this.element.y = newPosition.y - this.dragStart.y;
         this.element.alpha = 0.5;
         e.stopPropagation();
         this.moveListeners.forEach(f => f());
      }
   }

   private onDragStart(event: PIXI.interaction.InteractionEvent) {
      this.dragData = event;
      let tmpPos = event.data.getLocalPosition(this.element.parent);
      this.dragStart = new Point(tmpPos.x - this.element.x, tmpPos.y - this.element.y);
      this.isDragging = true;
   }

   private onDragEnd() {
      this.element.alpha = 1;
      this.isDragging = false;
      this.dragData = null;
   }

   onDragged(fn: () => void) {
      this.moveListeners.push(fn); // , context);
   }
}
