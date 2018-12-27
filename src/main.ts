import * as D from "./dama/DamaModel";
import * as Graph from "./dama/visual/DamaGraph";

class StartUp {
   async start() {
      let canvEl = <HTMLCanvasElement>window.document.getElementById("maincanvas");
      var g = new Graph.DamaGraph({
         viewCanvas: canvEl,
         size: { x: canvEl.offsetParent.clientWidth, y: window.innerHeight * 0.85 },
         backgroundColor: 0xEEEEEE
      });
   }
}

window.onload = () => new StartUp().start();
