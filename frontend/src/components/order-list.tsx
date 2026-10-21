'use client';

import { fetchOrders } from "@/lib/api";
import { formatPrice } from "@/lib/helper_functions";
import { Order } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Dictionary } from "@/i18n/getDictionary";
import { Locale } from "@/i18n/config";

function getStatusBadge(status: string, dict: Dictionary): { mod: string; label: string } {
    const s = status?.toLowerCase() ?? "";
    if (s.includes("deliver")) return { mod: "delivered", label: dict.orders.status_delivered };
    if (s.includes("ship")) return { mod: "shipped", label: dict.orders.status_shipped };
    if (s.includes("cancel")) return { mod: "cancelled", label: dict.orders.status_cancelled };
    return { mod: "processing", label: dict.orders.status_processing };
}

export default function OrderList({ dict, lang }: { dict: Dictionary; lang: Locale }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadOrders() {
            try {
                const data = await fetchOrders();
                setOrders(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadOrders();
    }, []);

    const getSubtitle = () => {
        if (orders.length === 0) return dict.orders.subtitle_empty;
        if (orders.length === 1) return dict.orders.subtitle_one.replace("{count}", String(orders.length));
        return dict.orders.subtitle_other.replace("{count}", String(orders.length));
    }

    if (loading) return null; // you can replace with a loader using dict

    return (
        <div className="home-container orders-page">
            {/* Page header */}
            <div className="orders-page__header">
                <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 700 }}>
                    {dict.orders.title}
                </h1>
                <p className="orders-page__subtitle">
                    {getSubtitle()}
                </p>
            </div>

            {/* Empty state */}
            {orders.length === 0 && (
                <div className="empty-state" style={{ textAlign: "center" }}>
                    <div className="empty-state__icon" aria-hidden="true">📦</div>
                    <h2 className="empty-state__title">{dict.orders.empty_title}</h2>
                    <p className="empty-state__hint">
                        {dict.orders.empty_hint}
                    </p>
                    <Link href={`/${lang}/products`} className="empty-state__btn">
                        {dict.orders.browse_appliances}
                    </Link>
                </div>
            )}

            {/* Orders list */}
            {orders.length > 0 && (
                <div className="orders-list">
                    {orders.map((order) => {
                        const { mod, label } = getStatusBadge(order.status, dict);
                        const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);

                        return (
                            <article key={order.id} className="order-card">
                                {/* Card header */}
                                <div className="order-card__header">
                                    <div className="order-card__meta-group">
                                        <div className="order-card__meta">
                                            <span className="order-card__label">{dict.orders.label_order}</span>
                                            <span className="order-card__val order-card__id">
                                                #{order.id}
                                            </span>
                                        </div>
                                        <div className="order-card__meta">
                                            <span className="order-card__label">{dict.orders.label_total}</span>
                                            <span className="order-card__val">
                                                {formatPrice(order.total_amount, lang)}
                                            </span>
                                        </div>
                                        <div className="order-card__meta">
                                            <span className="order-card__label">{dict.orders.label_items}</span>
                                            <span className="order-card__val">
                                                {itemCount} {itemCount === 1 ? dict.orders.item : dict.orders.items}
                                            </span>
                                        </div>
                                        {order.shipping_address && (
                                            <div className="order-card__meta">
                                                <span className="order-card__label">{dict.orders.label_ship_to}</span>
                                                <span className="order-card__val">
                                                    {order.shipping_address}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="order-card__status-group">
                                        <span className={`status-badge status-badge--${mod}`}>
                                            {label}
                                        </span>
                                        {order.is_paid && (
                                            <span
                                                className="status-badge"
                                                style={{
                                                    background: "rgba(168,98,56,0.08)",
                                                    color: "var(--color-volt)",
                                                    border: "1px solid rgba(168,98,56,0.25)",
                                                }}
                                            >
                                                {dict.orders.paid}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="order-card__body">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="order-item">
                                            {/* Thumbnail */}
                                            <div className="order-item__image-wrapper">
                                                {item.product.image ? (
                                                    <Image
                                                        src={item.product.image}
                                                        alt={item.product.name}
                                                        fill
                                                        sizes="64px"
                                                        className="order-item__image"
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontFamily: "var(--font-display)",
                                                            fontWeight: 700,
                                                            fontSize: "1.25rem",
                                                            color: "var(--color-steel)",
                                                        }}
                                                        aria-hidden="true"
                                                    >
                                                        {item.product.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="order-item__details">
                                                <Link
                                                    href={`/${lang}/products/${item.product.slug}`}
                                                    className="order-item__title"
                                                >
                                                    {item.product.name}
                                                </Link>
                                                {item.product.stock != null && (
                                                    <span className="order-item__spec">
                                                        {dict.orders.stock.replace("{stock}", String(item.product.stock))}
                                                    </span>
                                                )}
                                                <span className="order-item__qty">
                                                    {dict.orders.qty.replace("{qty}", String(item.quantity))}
                                                </span>
                                            </div>

                                            {/* Line price */}
                                            <span className="order-item__price">
                                                {formatPrice(
                                                    (Number(item.price) * item.quantity).toFixed(2), lang
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="order-card__footer">
                                    <span
                                        style={{
                                            fontSize: "var(--text-sm)",
                                            color: "var(--color-steel)",
                                            flex: 1,
                                        }}
                                    >
                                        {dict.orders.label_order_total}
                                    </span>
                                    <strong
                                        style={{
                                            fontFamily: "var(--font-display)",
                                            fontSize: "var(--text-lg)",
                                            color: "var(--color-ink)",
                                        }}
                                    >
                                        {formatPrice(order.total_amount, lang)}
                                    </strong>
                                    {Number(order.discount_amount) != 0 && (
                                        <span
                                            style={{
                                                fontFamily: "var(--font-display)",
                                                fontSize: "var(--text-lg)",
                                                color: "red",
                                                textDecoration: "line-through",
                                                marginLeft: "0.5rem",
                                            }}
                                        >
                                            {formatPrice(Number(order.total_amount) + Number(order.discount_amount), lang)}
                                        </span>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    )
}