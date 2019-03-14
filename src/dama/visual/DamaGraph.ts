import * as PIXI from "pixi.js";
import * as Viewport from "pixi-viewport";
import { Data, DataEntry, DataEntryType, Manipulation, Dama } from "../DamaModel";
import { CodeEditor } from "./CodeEditor";

export class DamaGraph implements WithContextMenu {
   private pixiApp: PIXI.Application;
   private viewPort: Viewport;
   private openedMenus: Array<ContextMenu | DialogBox> = [];
   private manipulationNodes: ManipulationNode[] = [];

   /**
    * Creates a new graph
    *
    * @param {DamaGraphConfig} [config] config for graph to use
    */
   constructor(public config?: DamaGraphConfig, private dama?: Dama) {
      config = config || {};
      config.size = config.size || new Point(800, 800);
      config.workspaceSize = config.workspaceSize || new Point(4000, 4000);
      config.backgroundColor = config.backgroundColor || 0xEEEEEE;

      this.dama = dama || new Dama();

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

   hitTest(posWorld: Point): ManipulationNode {
      for (let element of this.manipulationNodes) {
         let elPos = element.getJoinHitBox();
         if (posWorld.x >= elPos.pos.x && posWorld.x <= (elPos.pos.x + elPos.size.x)) {
            if (posWorld.y >= elPos.pos.y && posWorld.y <= (elPos.pos.y + elPos.size.y)) {
               return element;
            }
         }
      }
      return null;
   }

   addDataNode(data: Data, position: Point): DataNode {
      let dn = new DataNode(this, data);
      let dnVis = dn.getGraphItem();
      this.viewPort.addChild(dnVis);
      dnVis.x = position.x;
      dnVis.y = position.y;
      this.dama.addNode(data);
      return dn;
   }

   removeDataNode(data: Data): DamaGraph {
      this.dama.removeNode(data);
      return this;
   }

   addManipulationNode(manipulationNode: ManipulationNode, position: Point): ManipulationNode {
      let mNVis = manipulationNode.getGraphItem();
      this.viewPort.addChild(mNVis);
      mNVis.x = position.x;
      mNVis.y = position.y;
      this.manipulationNodes.push(manipulationNode);
      this.dama.addNode(manipulationNode.manipulation);
      return manipulationNode;
   }

   removeManipulationNode(manipulationNode: ManipulationNode): DamaGraph {
      const index = this.manipulationNodes.indexOf(manipulationNode, 0);
      if (index > -1) {
         this.manipulationNodes.splice(index, 1);
      }
      this.dama.removeNode(manipulationNode.manipulation);
      return this;
   }

   private handleRightClickEvent(event: PIXI.interaction.InteractionEvent) {
      // close other context menus
      this.closeContextMenu();

      let target: any = event.target;

      // if target is viewport, redirect to this
      if (target instanceof Viewport)
         target = this;

      // if clicked element with Context-Menu, open context menu for it
      if (hasContext(target)) {
         let contextMenu = target.getContextMenu(
            this,
            new Point(this.pixiApp.view.offsetLeft + event.data.global.x,
               this.pixiApp.view.offsetTop + event.data.global.y)
         );
         this.openedMenus.push(contextMenu);
         this.pixiApp.view.parentElement.appendChild(contextMenu.render());
      }
      event.stopPropagation();
   }

   showDialog(dlg: DialogBox) {
      this.openedMenus.push(dlg);
      this.pixiApp.view.parentElement.appendChild(dlg.render());
   }

   private handleClickEvent(event: PIXI.interaction.InteractionEvent) {
      this.closeContextMenu();
   }

   private closeContextMenu() {
      this.openedMenus.forEach(element => {
         element.destroy();
      });
      this.openedMenus = [];
   }

   getContextMenu(parentGraph: DamaGraph, position: Point): ContextMenu {
      let contextMenu = new ContextMenu(position);
      // TODO: implement
      contextMenu.addButton("Add New Data", (e) => { console.log(e); });
      contextMenu.addButton("Add New Manipulation", (e) => { console.log(e); });
      contextMenu.addSeparationLine().addButton("Save Graph Json", (e) => {
         var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(this.dama.toJsonString());
         var downloadAnchorNode = document.createElement("a");
         downloadAnchorNode.setAttribute("href", dataStr);
         downloadAnchorNode.setAttribute("download", "DaMa_Graph.json");
         document.body.appendChild(downloadAnchorNode);
         downloadAnchorNode.click();
         downloadAnchorNode.remove();
      });

      return contextMenu;
   }

   toWorld(x: number, y: number): Point { return this.viewPort.toWorld(x, y); }
   toScreen(x: number, y: number): Point { return this.viewPort.toScreen(x, y); }
   toGlobal(x: number, y: number): Point { return this.viewPort.toGlobal(new PIXI.Point(x, y)); }
   toLocal(x: number, y: number): Point { return this.viewPort.toLocal(new PIXI.Point(x, y)); }

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
class DataNode extends PIXI.Graphics implements GraphItem, WithContextMenu {
   private titleBox: TitleBox;
   private inputNudge: InputNudge;
   private outputNudge: OutputNudge;
   private dataEntryBoxes: DataEntryBox[] = [];
   private graphItem?: PIXI.Graphics;
   private dragSetup: DraggableSetup;

   constructor(
      public readonly damaGraph: DamaGraph,
      public readonly data: Data,
      private readonly level: number = 0,
      isActive: boolean = false
   ) {
      super();
      this.titleBox = new TitleBox(
         { x: (210 - (this.level * 10)), y: 30 },
         this.data.name, GraphColor.Data,
         (level <= 0)
      );

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
         parentGraph.showDialog(
            new DialogBox("Delete data '" + this.data.name + "'?",
               (answer) => {
                  if (answer === "yes") {
                     parentGraph.removeDataNode(this.data);
                     this.destroy();
                  }
               },
               new Point(e.x, e.y))
         );
      });

      return cM;
   }

   destroy() {
      if (this.outputNudge) this.outputNudge.destroy();
      super.destroy();
   }
}

class DataEntryBox implements GraphItem {

   private outNudges: OutputNudge[] = [];
   private dataNodes: DataNode[] = [];

   constructor(
      public damaGraph: DamaGraph,
      public readonly dataElement: DataEntry,
      private readonly level = 0
   ) {
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
         .drawRoundedRect(1, 1, this.size.x, this.size.y, 4)
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
 * Input nudge graph element
 */
class InputNudge extends PIXI.Graphics implements GraphItem {
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

/**
 * Output nudge element
 */
class OutputNudge
   extends PIXI.Graphics
   implements GraphItem, WithContextMenu {

   private isDragging: boolean = false;
   private conLine: ConnectionLine;
   private connections: ManipulationNode[] = [];

   constructor(
      public readonly damaGraph: DamaGraph,
      public readonly dataEntries: DataEntry[],
      public loc: Point,
      public isActive: boolean = false
   ) {
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
      let ctxMenu = new ContextMenu(position).addButton("Create Manipulation from here",
         (e) => {
            let posWorld = parentGraph.toWorld(
               this.getGlobalPosition().x + 10,
               this.getGlobalPosition().y);
            let mNode = new ManipulationNode(this.damaGraph, new Manipulation("Generic"));
            parentGraph.addManipulationNode(
               mNode,
               posWorld
            );
            mNode.addConnection(this);
            this.connections.push(mNode);
         },
         this
      );

      if (this.connections.length > 0) {
         ctxMenu.addButton("Remove all connections", (e) => {
            parentGraph.showDialog(
               new DialogBox("Remove all connections?",
                  (answer) => {
                     if (answer === "yes") {
                        this.removeAllConnections();
                     }
                  },
                  new Point(e.x, e.y))
            );
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
            this.damaGraph.addManipulationNode(
               mNode,
               posWorld
            );
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

class ManipulationNode extends PIXI.Container implements GraphItem, WithContextMenu {
   private titleBox: TitleBox;
   private inputNudge: InputNudge;
   private outputNudge: OutputNudge;
   private outDataNode: DataNode;
   private dragSetup: DraggableSetup;
   private inputConnections: Map<OutputNudge, ConnectionLine> = new Map<OutputNudge, ConnectionLine>();
   private codeEditor: CodeEditor;

   constructor(
      public readonly damaGraph: DamaGraph,
      public manipulation: Manipulation,
      position?: Point
   ) {
      super();

      this.titleBox = new TitleBox(
         new Point(300, 50),
         manipulation.name,
         GraphColor.Manipulation,
         true
      );
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
         this.outputNudge = new OutputNudge(
            this.damaGraph,
            this.manipulation.Output.Entries,
            { x: this.titleBox.size.x, y: 10 },
            true
         );

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
         parentGraph.showDialog(
            new DialogBox("Delete data '" + this.manipulation.name + "'?",
               (answer) => { if (answer === "yes") this.destroy(); },
               new Point(e.x, e.y))
         );
      }).addButton("Open Code", (e) => {
         if (!this.codeEditor)
            this.codeEditor = new CodeEditor("js", this.manipulation);

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

   getJoinHitBox(): { pos: Point, size: Point } {
      return { pos: { x: this.x, y: this.y }, size: this.titleBox.size };
   }
}

class ConnectionLine extends PIXI.Graphics implements GraphItem {
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

class DraggableSetup {
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

enum GraphColor {
   Number = 0x3A6EA5,
   String = 0xDD9787,
   Data = 0x7D8491, // F6E7CB,
   InputNudge = 0xFFFFFF,
   InputNudgeActive = 0xC6EBBE,
   OutputNudge = 0xFFFFFF,
   OutputNudgeActive = 0xC6EBBE,
   Manipulation = 0xCD5C5C,
   Connection = 0x000000,
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

   addButton(text: string, onClick: (e: MouseEvent) => void, context?: any): ContextMenu {
      if (this.menuElement)
         throw new Error("Can not add buttons after rendering.");

      let btn = window.document.createElement("button");
      btn.innerText = text;
      btn.type = "button";
      btn.className = "btn btn-outline-primary";

      btn.onclick = (e) => {
         context ? onClick.call(context, e) : onClick(e);
         this.destroy();
      };
      btn.oncontextmenu = (e) => { e.preventDefault(); };
      this.elements.push(btn);
      return this;
   }

   addSeparationLine(): ContextMenu {
      if (this.menuElement)
         throw new Error("Can not add buttons after rendering.");

      let div = window.document.createElement("hr");
      div.setAttribute("style",
         "border:dotted #000000 2px; margin: 0; width: -webkit-fill-available; width: -moz-available;");
      div.width = "100";
      div.oncontextmenu = (e) => { e.preventDefault(); };
      this.elements.push(div);
      return this;
   }

   render(): HTMLDivElement {
      if (this.menuElement)
         return this.menuElement;

      this.menuElement = window.document.createElement("div");
      this.menuElement.className = "toast show";

      let btnGroup = window.document.createElement("div");
      btnGroup.className = "btn-group-vertical btn-group-sm";
      btnGroup.setAttribute("style", "padding: .1rem;");

      this.elements.forEach(element => {
         btnGroup.appendChild(element);
      });
      this.menuElement.appendChild(btnGroup);

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

/**
 * Generic Context Menu used for right click menu's
 */
class DialogBox {
   private menuElement?: HTMLDivElement;
   private elements: HTMLElement[] = [];

   constructor(question: string, onAnswer: (answer: "yes" | "no") => void, position: Point, context?: any) {

      let btnYes = window.document.createElement("button");
      btnYes.innerHTML = "<i class='fas fa-check'></i> Yes";
      btnYes.type = "button";
      btnYes.className = "btn btn-outline-danger btn-sm";
      btnYes.onclick = (e) => {
         context ? onAnswer.call(context, "yes") : onAnswer("yes");
         this.destroy();
      };

      let btnNo = window.document.createElement("button");
      btnNo.innerHTML = "<i class='fas fa-times'></i> No";
      btnNo.type = "button";
      btnNo.className = "btn btn-outline-secondary btn-sm";
      btnNo.onclick = (e) => {
         context ? onAnswer.call(context, "no") : onAnswer("no");
         this.destroy();
      };

      this.elements.push(btnYes);
      this.elements.push(btnNo);

      this.menuElement = window.document.createElement("div");
      this.menuElement.className = "toast show";

      let header = window.document.createElement("div");
      header.className = "toast-header";

      let title = window.document.createElement("strong");
      title.className = "mr-auto";
      title.innerText = question;
      header.appendChild(title);

      let btnGroup = window.document.createElement("div");
      btnGroup.className = "btn-group";
      btnGroup.setAttribute("style", "padding: .5rem; min-width: 150px;");
      this.elements.forEach(element => {
         btnGroup.appendChild(element);
      });

      this.menuElement.appendChild(header);
      this.menuElement.appendChild(btnGroup);

      this.menuElement.oncontextmenu = (e) => { e.preventDefault(); };
      this.menuElement.style.position = "absolute";
      this.menuElement.style.left = (position.x) + "px";
      this.menuElement.style.top = (position.y) + "px";
   }

   render(): HTMLDivElement {
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
