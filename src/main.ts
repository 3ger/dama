import {DamaEditor} from "./dama/interaction/DamaEditor";

class StartUp {
   async start() {
      new DamaEditor();
   }
}

window.onload = () => new StartUp().start();
