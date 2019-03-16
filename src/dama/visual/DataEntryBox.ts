import { Data, DataEntry, DataEntryType } from "../DamaModel";
import { DataNode } from "./DataNode";
import { DamaGraph } from "./DamaGraph";
import { GraphItem } from "./GraphItem";
import { GraphColor } from "./GraphColor";
import { OutputNudge } from "./OutputNudge";
import { TitleBox } from "./TitleBox";

export class DataEntryBox implements GraphItem {
   private outNudges: OutputNudge[] = [];
   private dataNodes: DataNode[] = [];

   constructor(public damaGraph: DamaGraph, public readonly dataElement: DataEntry, private readonly level = 0) {
      // new TitleBox({ x: 195, y: 30 }, this.data.name, GraphColor.Data);
   }

   getGraphItem(parent?: PIXI.Container): PIXI.DisplayObject {
      let g = new PIXI.Container();
      switch (this.dataElement.getType()) {
         // if simple data (not Data node), just add simple box
         case DataEntryType.Number:
         case DataEntryType.String:
            this.addSimpleBox(g, this.dataElement);
            break;
         // add data entry
         case DataEntryType.Data:
            // TODO: IMPROVE!
            if (this.dataElement.value instanceof Data) {
               let dtNode = new DataNode(this.damaGraph, this.dataElement.value, this.level + 1);
               this.dataNodes.push(dtNode);
               g.addChild(dtNode.getGraphItem(g));
            }
            break;
         default:
            throw new Error("Given DataEntryType for DataEntry is not supported.");
      }
      return g;
   }

   notifyMove() {
      this.outNudges.forEach(element => {
         element.notifyMove();
      });
      this.dataNodes.forEach(element => {
         element.notifyMove();
      });
   }

   private addSimpleBox(g: PIXI.Container, dataEntry: DataEntry): any {
      let color = dataEntry.getType() === DataEntryType.String ? GraphColor.String : GraphColor.Number;
      let titleBox = new TitleBox({ x: 200 - this.level * 10, y: 30 }, this.dataElement.name, color);
      let outNudge = new OutputNudge(this.damaGraph, [dataEntry], { x: titleBox.size.x, y: 1 });
      this.outNudges.push(outNudge);
      g.addChild(titleBox.getGraphItem(g));
      g.addChild(outNudge.getGraphItem(g));
   }
}
