import { Log } from "./log";

// Dama Data Model

abstract class DaMaObject {
   private Id: string;

   constructor(id?: string) { this.Id = id ? id : DaMaObject.uuidv4(); }

   getId(): string { return this.Id; }

   /**
    * Creates UUIDv4
    * Function taken from https://stackoverflow.com/a/2117523
    */
   protected static uuidv4(): string {
      return ([1e7] as any + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: number) =>
         (c ^ (crypto.getRandomValues(new Uint8Array(1)) as Uint8Array)[0] & 15 >> c / 4).toString(16)
      );
   }
}

/**
 * Representing the Data-Node
 */
export class Data extends DaMaObject {
   constructor(public name: string, public Entries?: Array<DataEntry>, id?: string) {
      super(id);
      this.Entries = Entries || [];
   }

   /**
    * Adds data-entry to the DataNode and returns the DataNode
    * @param element data-entry to add
    */
   public add(element: { value: string | number, name: string } | DataEntry): Data {
      var tmpEntry: DataEntry;
      if (element instanceof DataEntry) tmpEntry = element;
      else tmpEntry = new DataEntry(element.name, element.value);
      this.Entries.push(tmpEntry);
      return this;
   }
}

/**
 *
 */
interface DataSourceInterface {
   getDataPreview(): Promise<Data>;
}

/**
 * Simple JSON GET request Data Source
 */
export class DataSourceSimpleJsonRequest implements DataSourceInterface {
   constructor(public readonly url: string, public readonly dataName: string) { }

   async getDataPreview(): Promise<Data> {
      let res = await fetch(this.url);
      if (res) {
         let data = await res.json();
         return new Data(this.dataName, this.parseJsonRecursive(data));
      }
      else {
         Log.err(`Error can not get json from '${this.url}' in ${this}.`);
         return new Data(this.dataName);
      }
   }

   // TODO IMPLEMENT!
   private parseJsonRecursive(data: any): Array<DataEntry> {
      // TODO IMPLEMENT!
      return [new DataEntry("data.name", "data.value")];
   }
}

/**
 * Represents one data entry in DataNode
 *
 * TODO: check if we can get rid of this entity, use tuple for example and if beneficial to do so.
 */
export class DataEntry {
   constructor(public name: string, public value?: string | number | Data) { }

   getType(): DataEntryType {
      if (this.value instanceof Data) return DataEntryType.Data;
      if (typeof this.value === "string") return DataEntryType.String;
      if (typeof this.value === "number") return DataEntryType.Number;
      return DataEntryType.Invalid;
   }
}

export enum DataEntryType {
   Number,
   String,
   Data,
   Invalid
}

/**
 * Represents the manipulation node
 */
export class Manipulation extends DaMaObject {

   get Output(): Data {
      return this.getOutput();
   }

   // TODO: rework
   get code(): string {
      let fLine = "// Params: ";
      this.parameters.forEach(element => {
         fLine += element.name + ", ";
      });

      if ((this._code.match(/\n/g) || "").length + 1 > 1) {
         this._code = this._code.slice(this._code.indexOf("\n") + 2);
      }

      return fLine.slice(0, -2) + "\n\n" + this._code;
   }

   set code(code: string) {
      this._code = code;
   }

   /**
    * Returns true if this manipulation has out data.
    */
   hasOut(): boolean {
      return this.Output.Entries.length > 0;
   }

   constructor(
      public name: string,
      public parameters?: Array<DataEntry>,
      private _code?: string,
      id?: string) {

      super(id);
      this.parameters = parameters || [];
      this.code = _code || "";
   }

   /**
    * Adds given parameter to this Manipulation.
    * @params params parameter to add to this Manipulation.
    */
   addParam(...params: DataEntry[]): Manipulation {
      this.parameters.push(...params);
      return this;
   }

   /**
    * Deletes given parameter from this Manipulation.
    * @param params parameter to delete from this Manipulation.
    */
   deleteParameter(...params: DataEntry[]): any {
      params.forEach((dataEntry) => {
         const index = this.parameters.indexOf(dataEntry, 0);
         if (index > -1) {
            this.parameters.splice(index, 1);
         }
      });
   }

   /**
    * TODO: IMPLEMENT -> need server eval?
    */
   private getOutput(): Data {
      // TODO: IMPLEMENT
      return new Data(">>>", this.parameters);
   }
}

/**
 * Represents the graph of Dama, containing Data and Manipulations
 */
export class Dama {
   private nodes: Array<Manipulation | Data> = new Array<Manipulation | Data>();

   getNodeByName(name: string): Array<Data | Manipulation> | null {
      return Array
         .from(this.nodes.values())
         .filter((element: Manipulation | Data) => element.name === name) || null;
   }

   addNode(node: Manipulation | Data): Dama {
      this.nodes.push(node);
      return this;
   }

   removeNode(node: Manipulation | Data): Dama {
      const index = this.nodes.findIndex((element) => element.getId() === node.getId());
      if (index > -1) this.nodes.splice(index, 1);
      return this;
   }

   toJsonString(): string {
      return JSON.stringify(this.nodes, null, 3);
   }

   loadJsonString(jsonString: string): void {
      // TODO implement

   }
}
