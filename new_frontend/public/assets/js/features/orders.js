import { fetchList } from "../core/api.js";
import { config, money, t } from "../core/config.js";
import { authToken } from "../core/storage.js";
import {
  empty,
  escapeHtml as e,
  image,
  loading,
  renderError,
  signInPrompt,
} from "../core/ui.js";

function orderCard(order) {
  const status =
    {
      pending: t("ui.pending"),
      processing: t("orders.status_processing"),
      shipped: t("orders.status_shipped"),
      delivered: t("orders.status_delivered"),
      cancelled: t("orders.status_cancelled"),
      failed: t("ui.failed"),
    }[order.status] ?? order.status;
  const items = Array.isArray(order.items) ? order.items : [];
  return `<article class="order-card"><div class="order-card__header"><div class="order-card__meta-group"><span class="order-card__id">${e(t("orders.label_order"))} #${e(order.id)}</span><span class="order-card__meta">${order.created_at ? e(new Date(order.created_at).toLocaleDateString(config.locale)) : ""}</span></div><div class="order-card__status-group"><span class="status-badge status-badge--${["delivered", "shipped", "cancelled"].includes(order.status) ? e(order.status) : "processing"}">${e(status)}</span>${order.is_paid ? `<span class="order-paid-badge">${e(t("orders.paid"))}</span>` : ""}</div></div>
    <div class="order-card__body">${items.map((item) => `<div class="order-item"><div class="order-item__image-wrapper">${image(item.product?.image, item.product?.name ?? "", "order-item__image")}</div><div class="order-item__details"><h3 class="order-item__title">${e(item.product?.name)}</h3><span class="order-item__qty">${e(t("orders.qty", { qty: item.quantity }))}</span></div><span class="order-item__price">${e(money(item.line_total != null && item.line_total !== "" ? Number(item.line_total) : Number(item.price) * item.quantity))}</span></div>`).join("")}${order.shipping_address ? `<p>${e(t("orders.label_ship_to"))}: ${e(order.shipping_address)}</p>` : ""}</div><div class="order-card__footer"><span>${e(t("orders.label_order_total"))}</span><strong>${e(money(order.total_amount))}</strong>${Number(order.discount_amount) > 0 ? `<del>${e(money(Number(order.total_amount) + Number(order.discount_amount)))}</del>` : ""}</div></article>`;
}

export async function init(page = 1) {
  const container = jQuery("[data-orders-content]");
  if (!authToken()) {
    container.html(signInPrompt());
    return;
  }
  container.html(loading());
  try {
    const json = await fetchList(`orders?page=${page}`, {
      authenticated: true,
    });
    const meta = json.meta;
    container.html(
      json.data.length
        ? `<div class="orders-list">${json.data.map(orderCard).join("")}</div>${meta ? `<nav class="pagination" aria-label="${e(t("orders.title"))}"><button class="empty-state__btn" data-order-page="${Number(meta.current_page) - 1}" ${meta.current_page <= 1 ? "disabled" : ""}>${e(t("ui.previous"))}</button><span>${e(meta.current_page)} / ${e(meta.last_page)}</span><button class="empty-state__btn" data-order-page="${Number(meta.current_page) + 1}" ${meta.current_page >= meta.last_page ? "disabled" : ""}>${e(t("ui.next"))}</button></nav>` : ""}`
        : empty(t("orders.empty_title"), t("orders.empty_hint")),
    );
    container.find("[data-order-page]").on("click", function () {
      init(Number(jQuery(this).attr("data-order-page")));
    });
  } catch (error) {
    if (error.status === 401) container.html(signInPrompt());
    else renderError(container, error, () => init(page));
  }
}
