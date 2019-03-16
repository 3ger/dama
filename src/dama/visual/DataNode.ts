import { Data } from "../DamaModel";
import { DialogBox } from "./DialogBox";
import { ContextMenu } from "./ContextMenu";
import { WithContextMenu, DamaGraph } from "./DamaGraph";
import { InputNudge } from "./InputNudge";
import { GraphItem } from "./GraphItem";
import { Point } from "./Point";
import { GraphColor } from "./GraphColor";
import { DraggableSetup } from "./DraggableSetup";
import { OutputNudge } from "./OutputNudge";
import { TitleBox } from "./TitleBox";
import { DataEntryBox } from "./DataEntryBox";

/**
 * Represents the visual data node
 */
export class DataNode extends PIXI.Graphics implements GraphItem, WithContextMenu {
   private titleBox: TitleBox;
   private inputNudge: InputNudge;
   private outputNudge: OutputNudge;
   private dataEntryBoxes: DataEntryBox[] = [];
   private graphItem?: PIXI.Graphics;
   private dragSetup: DraggableSetup;

   constructor(public readonly damaGraph: DamaGraph, public readonly data: Data, private readonly level: number = 0, isActive: boolean = false) {
      super();
      this.titleBox = new TitleBox({ x: (210 - (this.level * 10)), y: 30 }, this.data.name, GraphColor.Data, (level <= 0));
      if (level <= 0)
         this.inputNudge = new InputNudge(isActive);
      this.outputNudge = new OutputNudge(this.damaGraph, data.Entries, { x: this.titleBox.size.x, y: 1 });
   }

   notifyMove() {
      this.dataEntryBoxes.forEach(el => {
         el.notifyMove();
      });
      this.outputNudge.notifyMove();
   }

   getGraphItem(parent?: PIXI.Container): PIXI.DisplayObject {
      if (this.graphItem)
         return this.graphItem;
      this.graphItem = new PIXI.Graphics();
      let curX = 10;
      let hasHeader = this.data.Entries.length > 1;
      // header box
      if (hasHeader) {
         let hdVis = this.titleBox.getGraphItem(this.graphItem);
         let onVis = this.outputNudge.getGraphItem(this.graphItem);
         if (parent)
            hdVis.y = parent.height;
         this.graphItem.addChild(hdVis, onVis);
      }
      // child elements (data-entries)
      this.data.Entries.forEach(element => {
         let entryBx = new DataEntryBox(this.damaGraph, element, this.level);
         let graphEl = entryBx.getGraphItem(this.graphItem);
         graphEl.y = hasHeader ? this.graphItem.height - 1 : this.level > 0 ? -1 : 1;
         graphEl.x = hasHeader ? curX : this.level > 0 ? curX : 0;
         this.graphItem.addChild(graphEl);
         this.dataEntryBoxes.push(entryBx);
      });
      if (this.inputNudge) {
         let inVis = this.inputNudge.getGraphItem(this.graphItem);
         if (!hasHeader) {
            // BUG HERE: TODO count depth (get first non Data item)
            // not important for now
            inVis.x = this.graphItem.x + 1.5;
            inVis.y = inVis.getBounds().height / 2 + 3.5;
         }
         this.graphItem.addChild(inVis);
      }
      if (hasHeader || this.level > 1) {
         // add surrounding box
         this.graphItem.beginFill(GraphColor.Data);
         this.graphItem.lineStyle(0, 0x0);
         this.graphItem.drawRoundedRect(2, 2, this.graphItem.width - 4, this.graphItem.height - 2, 4);
      }
      // level text
      if (hasHeader && this.level > 0) {
         let levelTxt = new PIXI.Text((this.level + 1).toString(), {
            // fontFamily: "Verdana",
            fontSize: 14,
            fill: 0xffffff,
            dropShadow: true,
            dropShadowColor: 0x0,
            dropShadowDistance: 1
         });
         levelTxt.y = this.titleBox.size.y;
         levelTxt.x = 7 - levelTxt.width / 2;
         this.graphItem.addChild(levelTxt);
      }
      if (this.level === 0) {
         this.addChild(this.graphItem);
         this.dragSetup = new DraggableSetup(this);
         this.dragSetup.onDragged(() => {
            this.notifyMove();
         });
         return this;
      }
      else {
         return this.graphItem;
      }
   }

   getContextMenu(parentGraph: DamaGraph, position: Point): ContextMenu {
      let cM = new ContextMenu(position);
      cM.addButton("Delete '" + this.data.name + "'", (e) => {
         parentGraph.showDialog(new DialogBox("Delete data '" + this.data.name + "'?", (answer) => {
            if (answer === "yes") {
               parentGraph.removeDataNode(this.data);
               this.destroy();
            }
         }, new Point(e.x, e.y)));
      });
      return cM;
   }

   destroy() {
      if (this.outputNudge)
         this.outputNudge.destroy();
      super.destroy();
   }
}
