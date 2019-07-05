import {DamaEditor} from "./dama/interaction/DamaEditor";
import { Log } from "./dama/log";

class StartUp {
   async start() {
      new DamaEditor().onLoaded = ( editor ) => { Log.log("loaded editor"); };
   }
}

window.onload = () => new StartUp().start();
