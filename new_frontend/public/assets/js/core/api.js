import { config, t } from "./config.js";
import { authToken, clearSession } from "./storage.js";

export class ApiError extends Error {
  constructor(message, status = 0, errors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors && typeof errors === "object" ? errors : {};
  }
}

/**
 * Browser-only client. Only idempotent GET requests may be retried.
 * @template T
 * @param {string} endpoint
 * @param {import('./types.js').RequestOptions} [options]
 * @returns {Promise<import('./types.js').ApiResponse<T>>}
 */
export async function request(
  endpoint,
  { method = "GET", data, authenticated = false, retries = 1 } = {},
) {
  if (!config.apiUrl) throw new ApiError(t("ui.network_error"));
  const token = authToken();
  if (authenticated && !token) throw new ApiError(t("api.login_required"), 401);
  const headers = {
    Accept: "application/json",
    "Accept-Language": config.locale,
  };
  if (authenticated) headers.Authorization = `Bearer ${token}`;
  const formData = data instanceof FormData;
  const options = {
    url: `${config.apiUrl}/${endpoint}`,
    method,
    headers,
    dataType: "json",
    timeout: 12000,
    contentType: formData ? false : "application/json",
    processData: false,
    data:
      data === undefined ? undefined : formData ? data : JSON.stringify(data),
  };
  for (let attempt = 0; ; attempt++) {
    try {
      const json = await jQuery.ajax(options);
      if (
        !json ||
        typeof json !== "object" ||
        typeof json.success !== "boolean"
      ) {
        throw new ApiError(t("ui.invalid_response"));
      }
      if (!json.success)
        throw new ApiError(
          typeof json.message === "string"
            ? json.message
            : t("ui.invalid_response"),
          422,
          json.errors,
        );
      return json;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      const status = Number(error.status) || 0;
      if (status === 401 && authenticated) clearSession();
      if (
        method === "GET" &&
        attempt < retries &&
        (status === 0 || status >= 500)
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, 250 * (attempt + 1)),
        );
        continue;
      }
      const json = error.responseJSON;
      throw new ApiError(
        typeof json?.message === "string"
          ? json.message
          : t("ui.network_error"),
        status,
        json?.errors,
      );
    }
  }
}

export async function fetchList(endpoint, options) {
  const json = await request(endpoint, options);
  if (!Array.isArray(json.data)) throw new ApiError(t("ui.invalid_response"));
  return json;
}

let settingsPromise;
/** @returns {Promise<import('./types.js').Settings>} */
export function settings() {
  settingsPromise ??= request("settings")
    .then((json) => {
      if (
        !json.data ||
        typeof json.data !== "object" ||
        Array.isArray(json.data)
      )
        throw new ApiError(t("ui.invalid_response"));
      return json.data;
    })
    .catch((error) => {
      settingsPromise = undefined;
      throw error;
    });
  return settingsPromise;
}
