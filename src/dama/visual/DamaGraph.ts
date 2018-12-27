import * as PIXI from "pixi.js";
import * as Viewport from "pixi-viewport";
import { Data, DataEntry, DataEntryType, Manipulation } from "../DamaModel";


export class DamaGraph {
   private pixiApp: PIXI.Application;
   private viewPort: Viewport;
   private openedContextMenus: Array<ContextMenu> = [];

   private draggedNode?: DataNode | ManipulationNode;

   /**
    * Creates a new graph
    *
    * @param {DamaGraphConfig} [config] config for graph to use
    */
   constructor(public config?: DamaGraphConfig) {
      config = config || {};
      config.size = config.size || new Point(800, 800);
      config.workspaceSize = config.workspaceSize || new Point(4000, 4000);
      config.backgroundColor = config.backgroundColor || 0xEEEEEE;

      this.pixiApp = new PIXI.Application(
         config.size.x,
         config.size.y,
         {
            backgroundColor: config.backgroundColor,
            antialias: true,
            view: config.viewCanvas
         }
      );

      if (config.viewCanvas === undefined)
         document.body.appendChild(this.pixiApp.view);

      // make sure no events from browser are done by the browser on this element
      this.pixiApp.view.oncontextmenu = (a) => { a.preventDefault(); };
      this.pixiApp.view.onwheel = (a) => { a.preventDefault(); };

      // create viewport
      this.viewPort = new Viewport({
         screenWidth: config.size.x, // window.innerWidth,
         screenHeight: config.size.y, // window.innerHeight,
         worldWidth: config.workspaceSize.x,
         worldHeight: config.workspaceSize.y,
         interaction: this.pixiApp.renderer.plugins.interaction
      });

      // add the viewport to the stage
      this.pixiApp.stage.addChild(this.viewPort);
      this.pixiApp.stage.interactive = true;

      // activate plugins
      this.viewPort
         .drag()
         .pinch()
         .wheel()
         .clampZoom({
            minWidth: 200,
            minHeight: 200,
            maxWidth: config.workspaceSize.x,
            maxHeight: config.workspaceSize.y
         })
         .clamp({ direction: "all" })
         .decelerate();

      // EVENTS
      this.pixiApp.stage.on("rightclick", this.handleRightClickEvent, this);
      this.pixiApp.stage.on("tap", this.handleRightClickEvent, this);
      this.pixiApp.stage.on("click", this.handleClickEvent, this);

      this.addTest();
   }

   /**
    * Removes graph element from Dom and destroys it.
    */
   remove(): void {
      this.pixiApp.view.remove();
      this.pixiApp.destroy();
   }

   addDataNode(data: Data, position: Point): DamaGraph {
      let dn = new DataNode(data);
      let dnVis = dn.getGraphItem();
      this.viewPort.addChild(dnVis);
      dnVis.x = position.x;
      dnVis.y = position.y;
      return this;
   }

   addManipulation(manipulation: Manipulation, position: Point): DamaGraph {
      let mN = new ManipulationNode(manipulation);
      let mNVis = mN.getGraphItem();
      this.viewPort.addChild(mNVis);
      mNVis.x = position.x;
      mNVis.y = position.y;
      return this;
   }

   private handleRightClickEvent(event: PIXI.interaction.InteractionEvent) {
      // close other context menus
      this.closeContextMenu();

      // if clicked on output, open context menu for it
      if (hasContext(event.target)) {
         let contextMenu = event.target.getContextMenu(
            this,
            new Point(this.pixiApp.view.offsetLeft + event.data.global.x,
               this.pixiApp.view.offsetTop + event.data.global.y)
         );
         this.openedContextMenus.push(contextMenu);
         this.pixiApp.view.parentElement.appendChild(contextMenu.render());
      }
   }

   private handleClickEvent(event: PIXI.interaction.InteractionEvent) {
      this.closeContextMenu();
   }

   private closeContextMenu() {
      this.openedContextMenus.forEach(element => {
         element.destroy();
      });
      this.openedContextMenus = [];
   }

   /**
    * Adds test nodes
    */
   addTest() {
      const ADD_NUM_MIN: number = 1;
      const ADD_NUM_MAX: number = 8;

      let testDataEntry1 = new DataEntry("Number Entry 1", 11111);
      let testDataEntry2 = new DataEntry("Text Entry 1", "11111");

      let level4 = new DataEntry("Data 4",
         new Data("Level 4", [testDataEntry2, testDataEntry1])
      );
      let level3 = new DataEntry("Data 3",
         new Data("Level 3", [testDataEntry2, testDataEntry1, level4])
      );

      let numItr = Math.floor(Math.random() * ADD_NUM_MAX) + ADD_NUM_MIN;

      for (let index = 0; index < numItr; index++) {

         let countEntries = Math.floor(Math.random() * 10) + 1;
         let dat = new Data("Data" + index);

         for (let indEnt = 0; indEnt < countEntries; indEnt++) {
            let typeNext = Math.round(Math.random() * 3);
            let nextEntry = new DataEntry("Entry_" + index + "_" + indEnt,
               typeNext === 0 ? index
                  : (typeNext === 1 ? "i: " + index
                     : new Data("Data_" + index + "_" + indEnt,
                        [Math.floor(Math.random() * 2) === 0 ? level3 : level4])));
            dat.add(nextEntry);
         }

         this.addDataNode(dat, { x: index * 250, y: Math.floor(Math.random() * 600) });
      }
   }
}

/**
 * Represents the visual data node
 */
class DataNode extends PIXI.Graphics implements GraphItem {
   private titleBox: TitleBox;
   private inputNudge: InputNudge;
   private outputNudge: OutputNudge;
   private dataEntryBoxes: DataEntryBox[] = [];
   private graphItem?: PIXI.Graphics;
   private isDragging: boolean = false;
   private dragData: PIXI.interaction.InteractionEvent;
   private dragStart: Point;

   constructor(public readonly data: Data, private readonly level: number = 0, isActive: boolean = false) {
      super();
      this.titleBox = new TitleBox(
         { x: (210 - (this.level * 10)), y: 30 },
         this.data.name, GraphColor.Data,
         (level <= 0)
      );

      if (level <= 0)
         this.inputNudge = new InputNudge(isActive);

      this.outputNudge = new OutputNudge(data.Entries, { x: this.titleBox.size.x, y: 1 });
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
         let entryBx = new DataEntryBox(element, this.level);
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
            inVis.x = this.graphItem.getChildAt(0).x + 1.5;
            inVis.y = inVis.getBounds().height / 2 + 3.5;
         }
         this.graphItem.addChild(inVis);
      }

      if (hasHeader || this.level > 1) {
         // add surrounding box
         this.graphItem.beginFill(GraphColor.Data);
         this.graphItem.lineStyle(0, 0x0);
         this.graphItem.drawRect(2, 2, this.graphItem.width - 3, this.graphItem.height - 2);
      }

      // level text
      if (hasHeader && this.level > 0) {
         let levelTxt = new PIXI.Text((this.level + 1).toString(),
            {
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
         this.on("mousedown", this.onDragStart);
         this.on("touchstart", this.onDragStart);
         this.on("pointerdown", this.onDragStart);

         this.on("mouseup", this.onDragEnd);
         this.on("mouseupoutside", this.onDragEnd);
         this.on("touchend", this.onDragEnd);
         this.on("touchendoutside", this.onDragEnd);
         this.on("pointerup", this.onDragEnd);

         this.on("mousemove", this.onPointerMove);
         this.on("pointermove", this.onPointerMove);
         this.addChild(this.graphItem);
         this.interactive = true;
         return this;
      }
      else
         return this.graphItem;
   }

   private onPointerMove(e: PIXI.interaction.InteractionEvent) {
      if (this.isDragging) {
         let newPosition = this.dragData.data.getLocalPosition(this.parent);
         this.x = newPosition.x - this.dragStart.x;
         this.y = newPosition.y - this.dragStart.y;
         e.stopPropagation();
      }
   }

   private onDragStart(event: PIXI.interaction.InteractionEvent) {
      this.dragData = event;
      let tmpPos = event.data.getLocalPosition(this.parent);
      this.dragStart = new Point(tmpPos.x - this.x, tmpPos.y - this.y);
      this.alpha = 0.5;
      this.isDragging = true;
   }

   private onDragEnd() {
      this.alpha = 1;
      this.isDragging = false;
      this.dragData = null;
   }
}

class DataEntryBox implements GraphItem {

   constructor(public readonly dataElement: DataEntry, private readonly level = 0) {
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
               g.addChild(new DataNode(this.dataElement.value, this.level + 1).getGraphItem(g));
            }
            break;
         default:
            throw new Error("Given DataEntryType for DataEntry is not supported.");
      }
      return g;
   }

   private addSimpleBox(g: PIXI.Container, dataEntry: DataEntry): any {
      let color = dataEntry.getType() === DataEntryType.String ? GraphColor.String : GraphColor.Number;
      let titleBox = new TitleBox({ x: 200 - this.level * 10, y: 30 }, this.dataElement.name, color);
      let outNudge = new OutputNudge([dataEntry], { x: titleBox.size.x, y: 1 });
      g.addChild(titleBox.getGraphItem(g));
      g.addChild(outNudge.getGraphItem(g));
   }
}

class TitleBox implements GraphItem {
   constructor(public size: Point,
      public caption: string,
      public color?: GraphColor,
      public hasInputNudge: boolean = false) { }

   getGraphItem(parent?: PIXI.Container): PIXI.DisplayObject {
      // create the box
      let g = new PIXI.Graphics()
         .lineStyle(1, 0x0, 1)
         .beginFill(this.color)
         .drawRoundedRect(1, 1, this.size.x, this.size.y, 2)
         .endFill();

      // create the text
      let t = new PIXI.Text(this.caption,
         {
            fontFamily: "Verdana",
            fontSize: this.hasInputNudge ? 32 : 16,
            fill: 0xffffff,
            dropShadow: this.hasInputNudge,
            dropShadowColor: 0x0,
            dropShadowAlpha: 0.5,
            dropShadowAngle: 90,
            dropShadowDistance: 2,
            align: "center"
         }
      );

      // TODO: get the size of nudge dynamically not constant
      let addedWidth = this.hasInputNudge ? 33 : 16.5;

      //  calculate scale so text fits in
      let scale = Math.min(
         ((g.width < t.width) ? (g.width - addedWidth) / t.width : 1), // added from nudge TODO: make it better
         ((g.height < t.height) ? (g.height - 2) / t.height : 1)
      );

      // scale and move it so it is centered
      let moveY = 0.5 * Math.abs(g.height - t.height * scale);
      let moveX = 0.5 * Math.abs(g.width - t.width * scale);
      g.addChild(t).setTransform(moveX + (this.hasInputNudge ? 0 : -addedWidth / 2 + 2),
         moveY + 0.5,
         scale,
         scale); // added from nudge TODO: make it better

      return g;
   }
}

/**
 * Input data graph element
 */
class InputNudge implements GraphItem {
   private graphItem: PIXI.Graphics;

   constructor(public isActive: boolean = false) {
      this.graphItem = new PIXI.Graphics();
   }

   getGraphItem(parent?: PIXI.Container): PIXI.DisplayObject {
      this.redraw();
      return this.graphItem;
   }

   redraw(): void {
      this.graphItem.clear()
         .beginFill(this.isActive ? GraphColor.InputNudgeActive : GraphColor.InputNudge)
         .lineStyle(1, 0x0)
         .arc(0, 0, 13, Math.PI, Math.PI * 2);
      this.graphItem.rotation = (Math.PI * -1.5);
      this.graphItem.x = 1.5;
      this.graphItem.y = 16;
   }
}

/**
 * Output graph element
 */
class OutputNudge
   extends PIXI.Graphics
   implements GraphItem, WithContextMenu {

   constructor(public readonly dataEntry: DataEntry[], public loc: Point, public isActive: boolean = false) {
      super();

      // this.graphItem = new PIXI.Graphics();
      this.interactive = true;
      this.on("pointerover", this.onMouseOver, this);
      this.on("pointerout", this.onMouseOut, this);
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
      return new ContextMenu(position)
         .addButton("-->> Manipulation", (e) => {
            parentGraph.addManipulation(
               new Manipulation("Manipulation T", this.dataEntry, ""),
               new Point(this.getGlobalPosition().x + 10, this.getGlobalPosition().y)
            );
         });
   }
}

class ManipulationNode extends PIXI.Container implements GraphItem {
   private titleBox: TitleBox;
   private inputNudge: InputNudge;
   private outputNudge: OutputNudge;
   private outDataNode: DataNode;
   private isDragging: boolean = false;
   private dragData: PIXI.interaction.InteractionEvent;
   private dragStart: Point;

   constructor(public manipulation: Manipulation) {
      super();
      this.titleBox = new TitleBox(
         new Point(300, 50),
         manipulation.name,
         GraphColor.Manipulation,
         true
      );
      this.inputNudge = new InputNudge();
      this.outputNudge = new OutputNudge(manipulation.Output.Entries, { x: this.titleBox.size.x, y: 10 }, true);
      this.outDataNode = new DataNode(manipulation.Output, 0, true);

      this.addChild(this.titleBox.getGraphItem());
      let inNudge = this.inputNudge.getGraphItem();
      inNudge.y = this.height / 2;
      let outNudge = this.outputNudge.getGraphItem();
      outNudge.y = this.height / 2;
      this.addChild(inNudge, outNudge);
      let outData = this.outDataNode.getGraphItem();
      outData.x = this.width - 1;
      outData.y = outNudge.y / 2 - 3.5;
      this.addChild(outData);
      this.interactive = true;

      this.on("mousedown", this.onDragStart);
      this.on("touchstart", this.onDragStart);
      this.on("pointerdown", this.onDragStart);

      this.on("mouseup", this.onDragEnd);
      this.on("mouseupoutside", this.onDragEnd);
      this.on("touchend", this.onDragEnd);
      this.on("touchendoutside", this.onDragEnd);
      this.on("pointerup", this.onDragEnd);

      this.on("mousemove", this.onPointerMove);
      this.on("pointermove", this.onPointerMove);
   }

   getGraphItem(parent?: PIXI.Container): PIXI.DisplayObject {
      return this;
   }

   private onPointerMove(e: PIXI.interaction.InteractionEvent) {
      if (this.isDragging) {
         let newPosition = this.dragData.data.getLocalPosition(this.parent);
         this.x = newPosition.x - this.dragStart.x;
         this.y = newPosition.y - this.dragStart.y;
         e.stopPropagation();
      }
   }

   private onDragStart(event: PIXI.interaction.InteractionEvent) {
      this.dragData = event;
      let tmpPos = event.data.getLocalPosition(this.parent);
      this.dragStart = new Point(tmpPos.x - this.x, tmpPos.y - this.y);
      this.alpha = 0.5;
      this.isDragging = true;
   }

   private onDragEnd() {
      this.alpha = 1;
      this.isDragging = false;
      this.dragData = null;
   }
}

enum GraphColor {
   Number = 0x3A6EA5,
   String = 0xDD9787,
   Data = 0x7D8491, // F6E7CB,
   InputNudge = 0xFFFFFF,
   InputNudgeActive = 0xC6EBBE,
   OutputNudge = 0xFFFFFF,
   OutputNudgeActive = 0xC6EBBE,
   Manipulation = 0xCD5C5C,
}

/**
 * Used to pass in config to Graph
 */
export interface DamaGraphConfig {
   size?: Point;
   workspaceSize?: Point;
   backgroundColor?: number;
   viewCanvas?: HTMLCanvasElement;
}

/**
 * Represents 2D-Coordinates
 */
export class Point {
   constructor(public x: number, public y: number) { }

   toString(): string {
      return `x:${this.x}, y:${this.y}`;
   }
}

/**
 * Generic Context Menu used for right click menu's
 */
class ContextMenu {
   private menuElement?: HTMLDivElement;
   private elements: HTMLElement[] = [];

   constructor(private readonly position: Point) { }

   addButton(text: string, onClick: (e: MouseEvent) => void): ContextMenu {
      let btn = window.document.createElement("button");
      btn.innerText = text;
      btn.onclick = (e) => { onClick(e); this.destroy(); };
      btn.oncontextmenu = (e) => { e.preventDefault(); };
      let br = window.document.createElement("br");
      this.elements.push(btn);
      this.elements.push(br);
      return this;
   }

   render(): HTMLDivElement {
      if (this.menuElement)
         return this.menuElement;

      this.menuElement = window.document.createElement("div");
      this.elements.forEach(element => {
         this.menuElement.appendChild(element);
      });

      this.menuElement.oncontextmenu = (e) => { e.preventDefault(); };
      this.menuElement.style.position = "absolute";
      this.menuElement.style.left = (this.position.x) + "px";
      this.menuElement.style.top = (this.position.y) + "px";

      return this.menuElement;
   }

   destroy() {
      this.elements.forEach(element => {
         element.remove();
      });
      if (this.menuElement)
         this.menuElement.remove();
      this.menuElement = null;
   }
}

/// ******************************** Interfaces **************** //
interface GraphItem {
   getGraphItem(parent?: PIXI.Container): PIXI.DisplayObject;
}

interface WithContextMenu {
   getContextMenu(parentGraph: DamaGraph, position: Point): ContextMenu;
}

/// ******************************** TYPE-GUARDS **************** //
function hasContext(arg: any): arg is WithContextMenu {
   return (arg as WithContextMenu).getContextMenu !== undefined;
}

