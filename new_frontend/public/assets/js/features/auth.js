import { request } from "../core/api.js";
import { route, t } from "../core/config.js";
import { saveSession } from "../core/storage.js";
import { busy, escapeHtml as e } from "../core/ui.js";

function showErrors(form, errors) {
  for (const [field, messages] of Object.entries(errors)) {
    const input = form.find("[name]").filter(function () {
      return this.name === field;
    });
    input.attr("aria-invalid", "true").addClass("form-input--error");
    form
      .find("[data-field-error]")
      .filter(function () {
        return jQuery(this).attr("data-field-error") === field;
      })
      .text(Array.isArray(messages) ? messages.join(" ") : String(messages));
  }
}

export function init() {
  const form = jQuery("[data-auth-form]");
  const mode = form.attr("data-auth-form");
  jQuery("[data-password-toggle]").on("click", function () {
    const input = document.getElementById(
      jQuery(this).attr("data-password-toggle"),
    );
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    jQuery(this)
      .attr("aria-pressed", String(show))
      .attr("aria-label", t(show ? "ui.hide_password" : "ui.show_password"));
  });
  form.on("submit", async (event) => {
    event.preventDefault();
    const button = form.find("[type=submit]");
    if (button.prop("disabled")) return;
    const status = jQuery("[data-form-status]").prop("hidden", true).empty();
    form
      .find("[aria-invalid]")
      .removeAttr("aria-invalid")
      .removeClass("form-input--error");
    form.find("[data-field-error]").empty();
    const errors = {};
    for (const input of form[0].elements) {
      if (input.name && !input.checkValidity())
        errors[input.name] = [input.validationMessage];
    }
    if (
      mode === "register" &&
      form.find("[name=password]").val() !==
        form.find("[name=password_confirmation]").val()
    ) {
      errors.password_confirmation = [t("ui.invalid_form")];
    }
    if (Object.keys(errors).length) {
      showErrors(form, errors);
      status
        .prop("hidden", false)
        .attr("role", "alert")
        .addClass("auth-alert auth-alert--error")
        .text(t("ui.invalid_form"))
        .trigger("focus");
      return;
    }
    const data = Object.fromEntries(
      form
        .serializeArray()
        .filter((field) => field.name !== "_token")
        .map((field) => [field.name, field.value]),
    );
    busy(
      button,
      true,
      t(mode === "login" ? "auth.login_loading" : "auth.register_loading"),
    );
    try {
      const json = await request(`auth/${mode}`, { method: "POST", data });
      if (mode === "login") {
        saveSession(json.data);
        const next = new URLSearchParams(location.search).get("next");
        const destination = new URL(
          route(next === "cart" || next === "orders" ? next : "account"),
        );
        location.assign(destination.href);
      } else {
        form[0].reset();
        status
          .prop("hidden", false)
          .attr("role", "status")
          .removeClass("auth-alert--error")
          .addClass("auth-alert auth-alert--success")
          .html(
            `${e(t("ui.registration_success"))} <a class="auth-alert__link" href="${e(route("login"))}">${e(t("auth.proceed_signin"))}</a>`,
          )
          .trigger("focus");
      }
    } catch (error) {
      showErrors(form, error.errors ?? {});
      const message = ["storage_unavailable", "invalid_response"].includes(
        error.message,
      )
        ? t(`ui.${error.message}`)
        : error.message;
      status
        .prop("hidden", false)
        .attr("role", "alert")
        .removeClass("auth-alert--success")
        .addClass("auth-alert auth-alert--error")
        .text(message)
        .trigger("focus");
    } finally {
      busy(button, false);
    }
  });
}
