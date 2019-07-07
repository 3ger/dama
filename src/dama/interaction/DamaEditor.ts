import { DamaGraph } from "../visual/DamaGraph";
import { TemplateLoader } from "./TemplateLoader";
import { JsonLoader } from "../core/JsonLoader";
import { EnvironmentConfig } from "../core/EnvironmentConfig";
import { EditorEvents } from "./EditorEvents";
import { Log } from "../log";

export class DamaEditor {
   private readonly settingsPath: string = "dama/dama.json";
   private graph: DamaGraph;

   /**
    * Loaded event, fired when finished loading editor
    */
   public onLoaded: (editor: DamaEditor) => void;

   /**
    * @param startElement Div element where Editor is attached to, if empty attached to body.
    */
   constructor(private startElement?: HTMLDivElement) {

      if (!this.startElement) {
         this.startElement = document.createElement("div");
         document.body.appendChild(this.startElement);
      }

      this.startup();

      JsonLoader.load<EnvironmentConfig>(this.settingsPath)
         .then(settings => {                    // TODO: setup settings

         })
         .then(() => {                          // load template for editor
            TemplateLoader.loadTemplate(
               "DamaEditor",
               this.startElement,
               undefined,
               () => { // this is the done event for loader
                  this.setupEditorEvents();       // setup events
                  this.onLoaded(this);          // fire loaded event
               }
            ).then(result => {
               if (result) {
                  let canvasElement = <HTMLCanvasElement>window.document.getElementById("maincanvas");
                  this.graph = new DamaGraph({
                     viewCanvas: canvasElement,
                     size: { x: canvasElement.offsetParent.clientWidth, y: window.innerHeight * 0.85 },
                     backgroundColor: 0x777777,
                     autoSize: true,
                  });
               }
            });
         });
   }

   private setupEditorEvents(): void {
      for (let ev in EditorEvents) {
         const tagName = `data-dama-${ev}`;
         document.querySelectorAll(`[${tagName}]`).forEach((element) => {
            this.assignEvent(<EditorEvents>ev, element as HTMLElement, element.getAttribute(tagName));
         });
      }
   }

   assignEvent(event: EditorEvents, element: HTMLElement, functionPath: string) {

      switch (event) {
         case EditorEvents.click:
            element.addEventListener("click", () => { this.callPath(functionPath); });
            break;
         default:
            break;
      }
   }

   private callPath(functionPath: string): any {
      // TODO: make a better solution, this one seems tricky
      if (functionPath.includes("dama::editor::")) {
         let fName = functionPath.replace("dama::editor::", "");
         let fn = (<any>this)[fName];
         if (typeof fn === "function")
            fn.apply(this);
      }
   }

   private showProjectList(): void {
      Log.log("dama::editor::showProjectList() called");
   }

   private startup() {
      window.customElements.define("template-loader", TemplateLoader);
   }
}
