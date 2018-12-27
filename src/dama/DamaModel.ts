import { Log } from "./log";

// Dama Data Model

/**
 * Representing the Data-Node
 */
export class Data {
   constructor(public name: string, public Entries?: Array<DataEntry>) {
      this.Entries = Entries || [];
   }

   /**
    * Adds data-entry to the DataNode and returns the DataNode
    * @param element data-entry to add
    */
   public add(element: { value: string | number, name: string } | DataEntry): Data {
      this.Entries.push(element instanceof DataEntry ?
         element :
         new DataEntry(element.name, element.value)
      );
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
export class Manipulation {
   get Output(): Data {
      return this.getOutput();
   }

   constructor(public name: string, public parameters?: Array<DataEntry>, public code?: string) {
      this.parameters = parameters || [];
   }

   /**
    * Adds given parameter to this Manipulation.
    * @param param parameter to add to this Manipulation.
    */
   addParam(param: DataEntry): Manipulation {
      this.parameters.push(param);
      return this;
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
   private nodes: Map<string, Manipulation | Data> = new Map<string, Manipulation | Data>();

   getNode(name: string): Array<Data | Manipulation> | null {
      return Array
         .from(this.nodes.values())
         .filter((element: Manipulation | Data) => element.name === name) || null;
   }

   addNode(node: Manipulation | Data): Dama {
      this.nodes.set(this.nodes.size.toString(), node);
      return this;
   }
}
