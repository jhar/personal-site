import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Load the CloudFront Function source as-is (it has no exports).
const source = readFileSync(new URL("../modules/site/cloudfront-function.js", import.meta.url), "utf8");
const handler = new Function(`${source}; return handler;`)() as (
  event: { request: { uri: string } },
) => { uri: string };

const rewrite = (uri: string) => handler({ request: { uri } }).uri;

describe("CloudFront rewrite function", () => {
  it("maps pages to the exported .html files", () => {
    expect(rewrite("/")).toBe("/index.html");
    expect(rewrite("/about")).toBe("/about.html");
    expect(rewrite("/scratch/snake")).toBe("/scratch/snake.html");
    expect(rewrite("/admin/visits")).toBe("/admin/visits.html");
  });

  it("leaves files alone", () => {
    expect(rewrite("/resume.pdf")).toBe("/resume.pdf");
    expect(rewrite("/hello_world.html")).toBe("/hello_world.html");
    expect(rewrite("/_next/static/chunks/app.js")).toBe("/_next/static/chunks/app.js");
    expect(rewrite("/about/__next._tree.txt")).toBe("/about/__next._tree.txt");
  });

  it("serves index.html for directory paths", () => {
    expect(rewrite("/scratch/")).toBe("/scratch/index.html");
  });
});
