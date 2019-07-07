import * as PIXI from "pixi.js";
import * as Viewport from "pixi-viewport";
import { Data, DataEntry, Dama } from "../DamaModel";
import { DialogBox } from "./DialogBox";
import { ContextMenu } from "./ContextMenu";
import { DataNode } from "./DataNode";
import { ManipulationNode } from "./ManipulationNode";
import { DamaGraphConfig } from "./DamaGraphConfig";
import { Point } from "./Point";

export class DamaGraph implements WithContextMenu {
   private pixiApp: PIXI.Application;
   private viewPort: Viewport;
   private openedMenus: Array<ContextMenu | DialogBox> = [];
   private manipulationNodes: ManipulationNode[] = [];
   private parentElement: HTMLElement;

   /**
    * Creates a new graph
    *
    * @param {DamaGraphConfig} [config] config for graph to use
    */
   constructor(public config?: DamaGraphConfig, private dama?: Dama) {
      config = config || {};
      config.size = config.size || new Point(800, 800);
      config.workspaceSize = config.workspaceSize || new Point(4000, 4000);
      config.backgroundColor = typeof config.backgroundColor === "undefined" ? 0xEEEEEE : config.backgroundColor;

      this.dama = dama || new Dama();

      PIXI.utils.skipHello();
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

      this.parentElement = this.pixiApp.view.parentElement;

      if (this.config.autoSize) {
         this.setAutoSize(false);
         window.onresize = () => this.setAutoSize();
      }

      this.addTest();
   }

   private setAutoSize(onResize: boolean = true) {
      this.pixiApp.renderer.resize(this.parentElement.clientWidth, this.parentElement.clientHeight);
      this.pixiApp.view.style.height = "100%";
      if (onResize)
         this.viewPort.resize(this.parentElement.clientWidth, this.parentElement.clientHeight);
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

/// ******************************** Interfaces **************** //
export interface WithContextMenu {
   getContextMenu(parentGraph: DamaGraph, position: Point): ContextMenu;
}

/// ******************************** TYPE-GUARDS **************** //
function hasContext(arg: any): arg is WithContextMenu {
   return (arg as WithContextMenu).getContextMenu !== undefined;
}
