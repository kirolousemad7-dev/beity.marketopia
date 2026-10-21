import "./environment.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ApiError, request } from "../../public/assets/js/core/api.js";

beforeEach(() => localStorage.clear());

test("GET retries temporary failures and sends locale headers", async () => {
  let calls = 0;
  jQuery.ajax = async (options) => {
    assert.equal(options.headers["Accept-Language"], "en");
    assert.equal(options.timeout, 12000);
    if (++calls === 1) throw { status: 503 };
    return { success: true, data: [] };
  };
  await request("products");
  assert.equal(calls, 2);
});

test("checkout is never retried and field errors survive normalization", async () => {
  let calls = 0;
  jQuery.ajax = async () => {
    calls++;
    throw {
      status: 422,
      responseJSON: {
        message: "Invalid address",
        errors: { shipping_address: ["Required"] },
      },
    };
  };
  await assert.rejects(
    () => request("orders/checkout", { method: "POST", data: {} }),
    (error) =>
      error instanceof ApiError &&
      error.errors.shipping_address[0] === "Required",
  );
  assert.equal(calls, 1);
});

test("authentication sends bearer token and clears expired sessions", async () => {
  localStorage.setItem("auth_token", "expired");
  jQuery.ajax = async (options) => {
    assert.equal(options.headers.Authorization, "Bearer expired");
    throw { status: 401 };
  };
  await assert.rejects(
    () => request("orders", { authenticated: true }),
    (error) => error.status === 401,
  );
  assert.equal(localStorage.getItem("auth_token"), null);
});

test("missing authentication prevents the network request", async () => {
  jQuery.ajax = () => assert.fail("Network request must not run");
  await assert.rejects(
    () => request("orders", { authenticated: true }),
    (error) => error.status === 401,
  );
});
