import { Dama, DataEntry, Data, Manipulation, DataEntryType } from "./DamaModel";

describe("Dama.Model", () => {

   describe("DataEntry", () => {
      it("Type: number", () => {
         expect(new DataEntry("TestEntry", 123456.78).value).toEqual(jasmine.any(Number));
      });

      it("Type: string", () => {
         expect(new DataEntry("123", "TestEntry").value).toEqual(jasmine.any(String));
      });

      it("Type: Data", () => {
         let de = new DataEntry("123", "TestEntry");
         expect(de).toBeDefined();
         let d = new Data("TestData", [de]);
         expect(d).toBeDefined();
         expect(new DataEntry(d.name, d).value).toEqual(jasmine.any(Data));
      });
   });

   describe("Data", () => {

      it("Constructor", () => {
         expect(new Data("Test")).toBeTruthy();
      });

      it("add - DataEntry", () => {
         expect(new Data("Test").add({ value: "Test", name: "Test" })).toBeTruthy();
      });
   });

   describe("Manipulation", () => {

      it("Constructor", () => {
         expect(new Manipulation("Test")).toBeTruthy();
      });

      it("addParam", () => {
         expect(new Manipulation("Test")
            .addParam({ value: "Test", name: "Test", getType: () => DataEntryType.String })
            .parameters.length === 1
         ).toBeTruthy();
      });
   });

   describe("Dama", () => {

      it("Constructor", () => {
         expect(new Dama()).toBeTruthy();
      });

      it("addNode - Data", () => {
         expect(new Dama()
            .addNode(<Data>{ name: "Test" })
         ).toBeTruthy();
      });

      it("addNode - Manipulation", () => {
         expect(new Dama()
            .addNode(<Manipulation>{ name: "Test" })
         ).toBeTruthy();
      });
   });
});
