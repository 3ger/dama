import { GraphItem } from "./GraphItem";
import { Point } from "./Point";
import { GraphColor } from "./GraphColor";

export class TitleBox implements GraphItem {

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
      let t = new PIXI.Text(this.caption, {
         fontFamily: "Verdana",
         fontSize: this.hasInputNudge ? 32 : 16,
         fill: 0xffffff,
         dropShadow: this.hasInputNudge,
         dropShadowColor: 0x0,
         dropShadowAlpha: 0.5,
         dropShadowAngle: 90,
         dropShadowDistance: 2,
         align: "center"
      });
      // TODO: get the size of nudge dynamically not constant
      let addedWidth = this.hasInputNudge ? 33 : 16.5;
      //  calculate scale so text fits in
      let scale = Math.min(((g.width < t.width) ? (g.width - addedWidth) / t.width : 1), // added from nudge TODO: make it better
         ((g.height < t.height) ? (g.height - 2) / t.height : 1));
      // scale and move it so it is centered
      let moveY = 0.5 * Math.abs(g.height - t.height * scale);
      let moveX = 0.5 * Math.abs(g.width - t.width * scale);
      g.addChild(t).setTransform(moveX + (this.hasInputNudge ? 0 : -addedWidth / 2 + 2), moveY + 0.5, scale, scale); // added from nudge TODO: make it better
      return g;
   }
}
