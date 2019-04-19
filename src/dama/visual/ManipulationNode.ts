import { Manipulation } from "../DamaModel";
import { CodeEditorMonaco } from "../interaction/CodeEditorMonaco";
import { DialogBox } from "./DialogBox";
import { ContextMenu } from "./ContextMenu";
import { DataNode } from "./DataNode";
import { TitleBox } from "./TitleBox";
import { OutputNudge } from "./OutputNudge";
import { WithContextMenu, DamaGraph } from "./DamaGraph";
import { InputNudge } from "./InputNudge";
import { GraphItem } from "./GraphItem";
import { Point } from "./Point";
import { GraphColor } from "./GraphColor";
import { DraggableSetup } from "./DraggableSetup";
import { ConnectionLine } from "./ConnectionLine";

export class ManipulationNode extends PIXI.Container implements GraphItem, WithContextMenu {
   private titleBox: TitleBox;
   private inputNudge: InputNudge;
   private outputNudge: OutputNudge;
   private outDataNode: DataNode;
   private dragSetup: DraggableSetup;
   private inputConnections: Map<OutputNudge, ConnectionLine> = new Map<OutputNudge, ConnectionLine>();
   private codeEditor: CodeEditorMonaco;

   constructor(public readonly damaGraph: DamaGraph, public manipulation: Manipulation, position?: Point) {
      super();
      this.titleBox = new TitleBox(new Point(300, 50), manipulation.name, GraphColor.Manipulation, true);
      this.addChild(this.titleBox.getGraphItem());
      this.inputNudge = new InputNudge();
      let inNudge = this.inputNudge.getGraphItem();
      inNudge.y = this.height / 2;
      this.addChild(inNudge);
      if (this.manipulation.Output.Entries.length > 0)
         this.refreshOutNode();
      this.dragSetup = new DraggableSetup(this);
      this.dragSetup.onDragged(() => this.refreshConnections());
   }

   public refreshConnections(): void {
      if (this.inputConnections) {
         this.inputConnections.forEach((value: ConnectionLine) => {
            value.redraw();
         });
      }
      this.outDataNode.notifyMove();
   }

   private refreshOutNode() {
      if (this.outputNudge)
         this.outputNudge.destroy();
      if (this.outDataNode)
         this.outDataNode.destroy();
      if (this.manipulation.hasOut()) {
         this.outputNudge = new OutputNudge(this.damaGraph, this.manipulation.Output.Entries, { x: this.titleBox.size.x, y: 10 }, true);
         let outNudge = this.outputNudge.getGraphItem();
         outNudge.name = "outputNudge";
         outNudge.y = this.height / 2;
         if (this.getChildByName(outNudge.name))
            this.removeChild(this.getChildByName(outNudge.name));
         this.addChild(outNudge);
         this.outDataNode = new DataNode(this.damaGraph, this.manipulation.Output, 0, true);
         let outData = this.outDataNode.getGraphItem();
         outData.x = this.width - 1;
         outData.y = outNudge.y / 2 - 3.5;
         outData.name = "outDataNode";
         if (this.getChildByName(outData.name))
            this.removeChild(this.getChildByName(outData.name));
         this.addChild(outData);
      }
   }

   addConnection(fromNudge: OutputNudge): ManipulationNode {
      if (!this.inputConnections.has(fromNudge)) {
         // add line to nudge
         let conLine = new ConnectionLine(fromNudge, this.inputNudge);
         this.inputConnections.set(fromNudge, conLine);
         this.parent.addChild(conLine);
         conLine.redraw(); // corrects positions -> todo: fix with better design
         this.manipulation.addParam(...fromNudge.dataEntries);
      }
      if (this.manipulation.hasOut())
         this.refreshOutNode();
      return this;
   }

   getGraphItem(parent?: PIXI.Container): PIXI.DisplayObject {
      if (this.manipulation.hasOut())
         this.refreshOutNode();
      return this;
   }

   getContextMenu(parentGraph: DamaGraph, position: Point): ContextMenu {
      let cM = new ContextMenu(position);
      cM.addButton("Delete '" + this.manipulation.name + "'", (e) => {
         parentGraph.showDialog(new DialogBox("Delete data '" + this.manipulation.name + "'?", (answer) => {
            if (answer === "yes")
               this.destroy();
         }, new Point(e.x, e.y)));
      }).addButton("Open Code", (e) => {
         if (!this.codeEditor)
            this.codeEditor = new CodeEditorMonaco("csharp", this.manipulation);
         this.codeEditor.show();
      });
      return cM;
   }

   removeConnection(to: OutputNudge): any {
      if (this.inputConnections.has(to)) {
         this.parent.removeChild(this.inputConnections.get(to));
         this.manipulation.deleteParameter(...to.dataEntries);
         this.inputConnections.delete(to);
      }
      this.refreshOutNode();
   }

   destroy() {
      this.damaGraph.removeManipulationNode(this);
      this.inputConnections.forEach((value: ConnectionLine, key: OutputNudge) => {
         key.removeConnection(this);
         value.destroy();
      });
      if (this.outputNudge)
         this.outputNudge.destroy();
      if (this.outDataNode)
         this.outDataNode.destroy();
      this.inputConnections = null;
      super.destroy();
   }

   getJoinHitBox(): {
      pos: Point;
      size: Point;
   } {
      return { pos: { x: this.x, y: this.y }, size: this.titleBox.size };
   }
}
