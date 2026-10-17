import { describe, expect, it } from "vitest";
import {
  extractSceneString,
  parseTextElements,
  replaceDrawingBlock,
  updateTextElementLine,
} from "../src/mdParse.js";

const md = `---
secret: BEFORE-DRAWING
---
## Text Elements
First ^aaaaaaaa

Second line one
line two ^bbbbbbbb

Third ^cccccccc

## Drawing
\`\`\`json
{"elements":[]}
\`\`\`
%%
`;

describe("updateTextElementLine", () => {
  it("replaces only the target label and keeps the others", () => {
    const out = updateTextElementLine(md, "cccccccc", "NEW");
    const map = parseTextElements(out);
    expect(map.get("aaaaaaaa")).toBe("First");
    expect(map.get("bbbbbbbb")).toBe("Second line one\nline two");
    expect(map.get("cccccccc")).toBe("NEW");
    expect(out).toContain("## Text Elements\nFirst ^aaaaaaaa");
  });

  it("replaces a multi-line label in full", () => {
    const out = updateTextElementLine(md, "bbbbbbbb", "Short");
    const map = parseTextElements(out);
    expect(map.get("aaaaaaaa")).toBe("First");
    expect(map.get("bbbbbbbb")).toBe("Short");
    expect(map.get("cccccccc")).toBe("Third");
  });

  it("treats $ sequences in the label literally", () => {
    const label = "price $` $& $' $1 x";
    const out = updateTextElementLine(md, "aaaaaaaa", label);
    expect(parseTextElements(out).get("aaaaaaaa")).toBe(label);
    expect(out.match(/secret: BEFORE-DRAWING/g)).toHaveLength(1);
  });

  it("throws for an unknown id", () => {
    expect(() => updateTextElementLine(md, "zzzzzzzz", "x")).toThrow(/not found/);
  });
});

describe("replaceDrawingBlock", () => {
  it("treats $ sequences in the JSON body literally", () => {
    const body = JSON.stringify({ elements: [{ id: "x", type: "text", text: "a $` $& $' b" }] });
    for (const compressed of [false, true]) {
      const out = replaceDrawingBlock(md, body, compressed);
      expect(extractSceneString(out).sceneJson).toBe(body);
      expect(out.match(/secret: BEFORE-DRAWING/g)).toHaveLength(1);
    }
  });
});
