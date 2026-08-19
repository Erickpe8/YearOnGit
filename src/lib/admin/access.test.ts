import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAdminLogin } from "@/lib/admin/access";

describe("admin access", () => {
  it("treats Erickpe8 as admin regardless of casing", () => {
    assert.equal(isAdminLogin("Erickpe8"), true);
    assert.equal(isAdminLogin("erickpe8"), true);
    assert.equal(isAdminLogin(" ERICKPE8 "), true);
  });

  it("rejects other GitHub logins", () => {
    assert.equal(isAdminLogin("octocat"), false);
    assert.equal(isAdminLogin(null), false);
    assert.equal(isAdminLogin(""), false);
  });
});
