import { DataEntry, Manipulation } from "../DamaModel";
import { DialogBox } from "./DialogBox";
import { ContextMenu } from "./ContextMenu";
import { WithContextMenu, DamaGraph } from "./DamaGraph";
import { GraphItem } from "./GraphItem";
import { Point } from "./Point";
import { GraphColor } from "./GraphColor";
import { ConnectionLine } from "./ConnectionLine";
import { ManipulationNode } from "./ManipulationNode";
import * as Viewport from "pixi-viewport";

/**
 * Output nudge element
 */
export class OutputNudge extends PIXI.Graphics implements GraphItem, WithContextMenu {
   private isDragging: boolean = false;
   private conLine: ConnectionLine;
   private connections: ManipulationNode[] = [];

   constructor(public readonly damaGraph: DamaGraph, public readonly dataEntries: DataEntry[], public loc: Point, public isActive: boolean = false) {
      super();
      this.interactive = true;
      this.buttonMode = true;
      this.on("pointerover", this.onMouseOver, this);
      this.on("pointerout", this.onMouseOut, this);
      this.on("mousedown", (e: PIXI.interaction.InteractionEvent) => { this.onDragStart(e); }, this);
      this.on("touchstart", (e: PIXI.interaction.InteractionEvent) => { this.onDragStart(e); }, this);
      // this.on("pointerdown", (e: PIXI.interaction.InteractionEvent) => { this.onDragStart(e); }, this);
      this.on("mouseup", this.onDragEnd, this);
      this.on("mouseupoutside", this.onDragEnd, this);
      this.on("touchend", this.onDragEnd, this);
      this.on("touchendoutside", this.onDragEnd, this);
      this.on("pointerup", this.onDragEnd, this);
      this.on("mousemove", (e: PIXI.interaction.InteractionEvent) => { this.onPointerMove(e); }, this);
      this.on("pointermove", (e: PIXI.interaction.InteractionEvent) => { this.onPointerMove(e); }, this);
   }

   getGraphItem(parent?: PIXI.Container): PIXI.DisplayObject {
      return this.redraw();
   }

   private redraw(): PIXI.Graphics {
      this.beginFill(this.isActive ? GraphColor.OutputNudgeActive : GraphColor.OutputNudge);
      this.lineStyle(1, 0x0);
      this.arc(0, 0, 13, Math.PI, Math.PI * 2);
      this.rotation = (Math.PI * 1.5);
      this.x = this.loc.x + 0.5;
      this.y = this.loc.y + this.height * 0.5 + 13 / 2 + 1.5;
      return this;
   }

   onMouseOver(e: PIXI.DisplayObject): void {
      this.tint = GraphColor.OutputNudgeActive;
   }

   onMouseOut(e: PIXI.DisplayObject): void {
      this.tint = GraphColor.OutputNudge;
   }

   getContextMenu(parentGraph: DamaGraph, position: Point): ContextMenu {
      let ctxMenu = new ContextMenu(position).addButton("Create Manipulation from here", (e) => {
         let posWorld = parentGraph.toWorld(this.getGlobalPosition().x + 10, this.getGlobalPosition().y);
         let mNode = new ManipulationNode(this.damaGraph, new Manipulation("Generic"));
         parentGraph.addManipulationNode(mNode, posWorld);
         mNode.addConnection(this);
         this.connections.push(mNode);
      }, this);
      if (this.connections.length > 0) {
         ctxMenu.addButton("Remove all connections", (e) => {
            parentGraph.showDialog(new DialogBox("Remove all connections?", (answer) => {
               if (answer === "yes") {
                  this.removeAllConnections();
               }
            }, new Point(e.x, e.y)));
         });
      }
      return ctxMenu;
   }

   private removeAllConnections() {
      this.connections.forEach((connection) => {
         connection.removeConnection(this);
      });
      this.connections = [];
   }

   notifyMove(): void {
      if (this.connections) {
         this.connections.forEach(element => {
            element.refreshConnections();
         });
      }
   }

   removeConnection(manipulationNode: ManipulationNode): any {
      const index = this.connections.indexOf(manipulationNode, 0);
      if (index > -1) {
         this.connections.splice(index, 1);
      }
   }

   private onPointerMove(e: PIXI.interaction.InteractionEvent) {
      if (this.isDragging) {
         e.stopPropagation();
         if (!this.conLine) {
            this.conLine = new ConnectionLine(this);
            this.getParentMainView(this.parent).addChild(this.conLine);
         }
         this.tint = GraphColor.OutputNudgeActive;
         this.conLine.setToPos({ x: e.data.global.x, y: e.data.global.y });
         this.conLine.redraw();
      }
   }

   private onDragStart(event: PIXI.interaction.InteractionEvent) {
      event.stopPropagation();
      this.isDragging = true;
   }

   private getParentMainView(view: any): Viewport {
      return view.parent instanceof Viewport ? view.parent : this.getParentMainView(view.parent);
   }

   private onDragEnd(e: PIXI.interaction.InteractionEvent) {
      this.isDragging = false;
      this.tint = GraphColor.OutputNudge;
      if (this.conLine) {
         let posWorld = e.data.getLocalPosition(this.getParentMainView(this.parent));
         let mNode = this.damaGraph.hitTest(posWorld);
         if (mNode) {
            mNode.addConnection(this);
         }
         else {
            mNode = new ManipulationNode(this.damaGraph, new Manipulation("Generic"));
            this.damaGraph.addManipulationNode(mNode, posWorld);
            mNode.addConnection(this);
         }
         this.connections.push(mNode);
         this.getParentMainView(this.parent).removeChild(this.conLine);
         this.conLine.destroy();
         this.conLine = null;
      }
   }

   destroy() {
      this.removeAllConnections();
      super.destroy();
   }
}
