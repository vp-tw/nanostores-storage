/**
 * Tests for shallowEqual utility function.
 */

import { describe, expect, it } from "vitest";

import { shallowEqual } from "./shallow-equal";

describe("shallowEqual", () => {
  it("returns true for two empty objects", () => {
    expect(shallowEqual({}, {})).toBe(true);
  });

  it("returns true for objects with same keys and values", () => {
    expect(shallowEqual({ a: "1", b: "2" }, { a: "1", b: "2" })).toBe(true);
  });

  it("returns true for same reference", () => {
    const obj = { a: "1" };
    expect(shallowEqual(obj, obj)).toBe(true);
  });

  it("returns false for different number of keys", () => {
    expect(shallowEqual({ a: "1" }, { a: "1", b: "2" })).toBe(false);
    expect(shallowEqual({ a: "1", b: "2" }, { a: "1" })).toBe(false);
  });

  it("returns false for different values", () => {
    expect(shallowEqual({ a: "1" }, { a: "2" })).toBe(false);
  });

  it("returns false for different keys", () => {
    expect(shallowEqual({ a: "1" }, { b: "1" })).toBe(false);
  });

  it("returns false when one has extra key", () => {
    expect(shallowEqual({ a: "1" }, { a: "1", b: "2" })).toBe(false);
  });

  it("handles keys with empty string values", () => {
    expect(shallowEqual({ a: "" }, { a: "" })).toBe(true);
    expect(shallowEqual({ a: "" }, { a: "1" })).toBe(false);
  });

  it("handles special characters in values", () => {
    const special = 'hello\nworld\t"quotes"';
    expect(shallowEqual({ a: special }, { a: special })).toBe(true);
  });

  it("handles many keys", () => {
    const a: Record<string, string> = {};
    const b: Record<string, string> = {};
    for (let i = 0; i < 100; i++) {
      a[`key${i}`] = `value${i}`;
      b[`key${i}`] = `value${i}`;
    }
    expect(shallowEqual(a, b)).toBe(true);

    // eslint-disable-next-line dot-notation
    b["key50"] = "different";
    expect(shallowEqual(a, b)).toBe(false);
  });
});
