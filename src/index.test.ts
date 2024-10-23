import { expect, it } from "vitest";
import * as exports from "./index";

it("exports", () => {
  expect(exports).toBeDefined();
  expect(exports.Dependency).toBeDefined();
});
