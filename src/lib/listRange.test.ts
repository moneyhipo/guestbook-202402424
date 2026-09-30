import { describe, expect, test } from "vitest";
import { PAGE_SIZE, nextLimit, parseListLimit } from "@/lib/listRange";

describe("목록 범위 정책", () => {
  test("limit이 없으면 처음 5개를 보여준다", () => {
    expect(parseListLimit(undefined)).toBe(5);
  });

  test("5의 배수 limit은 그대로 보여준다", () => {
    expect(parseListLimit("15")).toBe(15);
  });

  test("5의 배수가 아니면 올려서 맞춘다", () => {
    expect(parseListLimit("7")).toBe(10);
  });

  test("숫자가 아니거나 0 이하면 처음 5개로 돌아간다", () => {
    expect(parseListLimit("abc")).toBe(5);
    expect(parseListLimit("-10")).toBe(5);
    expect(parseListLimit("0")).toBe(5);
  });

  test("지나치게 큰 값은 500개로 제한한다", () => {
    expect(parseListLimit("999999")).toBe(500);
  });

  test("같은 파라미터가 여러 번 오면 첫 값을 쓴다", () => {
    expect(parseListLimit(["10", "20"])).toBe(10);
  });

  test("더 보기를 누르면 5개를 더 보여준다", () => {
    expect(PAGE_SIZE).toBe(5);
    expect(nextLimit(5)).toBe(10);
  });
});
