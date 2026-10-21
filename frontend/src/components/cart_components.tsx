"use client";

import { applyCoupon, checkoutOrder } from "@/lib/api";
import { useCart } from "@/context/cart-context";
import Link from "next/link";
import { useState } from "react";
import Alert from "./alert";
import Image from "next/image";
import { formatPrice } from "@/lib/helper_functions";
import { Dictionary } from "@/i18n/getDictionary";
import { Settings } from "@/lib/types";
import { Locale } from "@/i18n/config";

const SHIPPING_NOTICE = "للشحن إلى المحافظات خارج القاهرة والجيزة والإسكندرية، يُرجى التواصل معنا.";

function ShippingNotice({ phone }: { phone?: string }) {
    const phrase = "التواصل معنا";
    const destination = (phone ?? "").trim();
    const href = destination.replace(/[^\d+]/g, "");
    if (!destination || !href || !SHIPPING_NOTICE.includes(phrase)) {
        return <p className="shipping-notice" lang="ar" dir="rtl">{SHIPPING_NOTICE}</p>;
    }
    const [before, after] = SHIPPING_NOTICE.split(phrase);
    return <p className="shipping-notice" lang="ar" dir="rtl">{before}<a href={`tel:${href}`}>{phrase}</a>{after}</p>;
}

export function CartContent({ dict, settings, lang }: { dict: Dictionary, settings: Settings, lang: Locale }) {
    const { items = [], removeItem, removePackage, updateQuantity, clearCart } = useCart() || {};
    const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const shipping = Number(settings.shipping_cost);
    const instapay = Number(settings.instapay_number);

    if (items.length === 0) return <EmptyCart dict={dict} lang={lang} />;

    const subtitle = items.length === 1
        ? dict.cart.subtitle_one.replace("{count}", String(items.length))
        : dict.cart.subtitle_other.replace("{count}", String(items.length));

    return (
        <main className="home-container cart-page">
            <div className="cart-page__header">
                <div>
                    <h1 className="cart-page__title">{dict.cart.title}</h1>
                    <p className="cart-page__subtitle">{subtitle}</p>
                </div>
                <button type="button" onClick={clearCart} className="cart-table__clear-btn">
                    {dict.cart.clear}
                </button>
            </div>

            <div className="cart-layout">
                <div className="cart-layout__main">
                    <div className="cart-table">
                        <div className="cart-table__header">
                            <span>{dict.cart.table_product}</span>
                            <span>{dict.cart.table_price}</span>
                            <span>{dict.cart.table_quantity}</span>
                            <span>{dict.cart.table_total}</span>
                        </div>
                        <div className="cart-table__body">
                            {items.map((item) => item.kind === "bundle" && item.components ? (
                                <article key={item.key} className="cart-package">
                                    <div className="cart-package__header">
                                        <Link href={`/${lang}/bundles/${item.slug}`} className="cart-table__title">{item.name}</Link>
                                        <button type="button" onClick={() => removePackage && item.key && removePackage(item.key)} className="cart-table__remove-btn">{dict.cart.remove}</button>
                                    </div>
                                    <ul className="cart-package__contents">
                                        {item.components.map((component) => (
                                            <li key={component.id} className="cart-package__item">
                                                <span>{component.name}</span>
                                                <span>{dict.cart.table_quantity}: {component.quantity * item.quantity}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <strong>{formatPrice(item.price * item.quantity, lang)}</strong>
                                </article>
                            ) : item.kind === "legacy-bundle" || item.bundleId ? (
                                <article key={item.key ?? String(item.id)} className="cart-package">
                                    <div className="cart-package__header">
                                        <span className="cart-table__title">{item.name}</span>
                                        <button type="button" onClick={() => removePackage && removePackage(String(item.bundleId))} className="cart-table__remove-btn">{dict.cart.remove}</button>
                                    </div>
                                    <p lang="ar" dir="rtl">يجب إضافة هذا العرض من جديد قبل إتمام الطلب. محتوياته المحفوظة لا يمكن طلبها كما هي.</p>
                                    <span>{dict.cart.table_quantity}: {item.quantity}</span>
                                </article>
                            ) : (
                                <div key={item.key ?? item.id} className="cart-table__row">
                                    <div className="cart-table__item">
                                        <div className="cart-table__image-wrapper">
                                            {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill sizes="80px" className="cart-table__image" /> : <div className="cart-table__placeholder"><span className="cart-table__placeholder-text">{item.name.charAt(0)}</span></div>}
                                        </div>
                                        <div className="cart-table__details">
                                            <Link href={`/${lang}/products/${item.slug}`} className="cart-table__title">{item.name}</Link>
                                            {item.spec && <span className="cart-table__spec">{item.spec}</span>}
                                            <button type="button" onClick={() => removeItem && removeItem(item.id)} className="cart-table__remove-btn">{dict.cart.remove}</button>
                                        </div>
                                    </div>
                                    <div className="cart-table__cell cart-table__cell--price" data-label={dict.cart.table_price}>{formatPrice(item.price, lang)}</div>
                                    <div className="cart-table__cell cart-table__cell--quantity" data-label={dict.cart.table_quantity}>
                                        <div className="quantity-control">
                                            <button type="button" onClick={() => updateQuantity && updateQuantity(item.id, item.quantity - 1)} className="quantity-control__btn" aria-label={dict.cart.decrease}>-</button>
                                            <span className="quantity-control__value">{item.quantity}</span>
                                            <button type="button" onClick={() => updateQuantity && updateQuantity(item.id, item.quantity + 1)} className="quantity-control__btn" aria-label={dict.cart.increase}>+</button>
                                        </div>
                                    </div>
                                    <div className="cart-table__cell cart-table__cell--total" data-label={dict.cart.table_total}>{formatPrice(Number(item.price) * item.quantity, lang)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <OrderSummery subtotal={subtotal} shipping={shipping} dict={dict} lang={lang} instapay={settings?.instapay_number || ''} contactPhone={settings?.contact_phone || ''} />
            </div>
        </main>
    );
}

export function EmptyCart({ dict, lang }: { dict: Dictionary, lang: Locale }) {
    return (
        <main className="home-container cart-page">
            <div className="empty-state">
                <div className="empty-state__icon" aria-hidden="true">🛒</div>
                <h1 className="empty-state__title">{dict.cart.empty_title}</h1>
                <p className="empty-state__hint">{dict.cart.empty_hint}</p>
                <Link href={`/${lang}/products`} className="empty-state__btn">{dict.cart.browse_catalog} &rarr;</Link>
            </div>
        </main>
    );
}

export function OrderSummery({ subtotal, shipping, dict, lang, instapay, contactPhone = "" }: { subtotal: number, shipping: number, dict: Dictionary, lang: Locale, instapay: string, contactPhone?: string }) {
    const { items, clearCart } = useCart();
    const [submiting, setSubmit] = useState(false);
    const [result, setResult] = useState<{ success: boolean; text: string } | null>(null);
    const [method, setMethod] = useState('');
    const [shippingInput, setShippingInput] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [couponData, setCouponData] = useState<{ coupon_id: number, discount_amount: number } | null>(null);
    const [applying, setApplying] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [fileName, setFileName] = useState(dict.cart.no_file);

    const discount = couponData?.discount_amount || 0;
    const totalAmount = subtotal + shipping - discount;


    const handleApply = async () => {
        if (!couponCode.trim()) return;
        setApplying(true); setCouponError(null);
        const res = await applyCoupon(couponCode.trim(), subtotal, dict);
        if (res.success) setCouponData(res.data);
        else { setCouponData(null); setCouponError(res.message); }
        setApplying(false);
    }
    const handleRemove = () => { setCouponData(null); setCouponCode(''); setCouponError(null); }

    const submit = async function () {
        setSubmit(true); setResult(null);
        const res = await checkoutOrder(
            items,
            method, shippingInput, dict, totalAmount, couponData ? couponCode : null, screenshot)

        if (res) { setResult({ success: res.success, text: res.message }); if (res.success) clearCart() }
        setSubmit(false)
    }

    return (
        <aside className="cart-layout__sidebar">
            {result && <Alert type={result.success ? 'success' : 'error'} text={result.text} />}
            <div className="summary-card">
                <h2 className="summary-card__title">{dict.cart.order_summary}</h2>
                <div className="summary-card__rows">
                    <div className="summary-card__row"><span className="summary-card__label">{dict.cart.subtotal}</span><span className="summary-card__val">{formatPrice(subtotal, lang)}</span></div>
                    <div className="summary-card__row"><span className="summary-card__label">{dict.cart.home_delivery}</span><span className="summary-card__val">{formatPrice(shipping, lang)}</span></div>
                    <ShippingNotice phone={contactPhone} />
                    {couponData && <div className="summary-card__row" style={{ color: '#16a34a' }}><span className="summary-card__label">{dict.cart.discount} ({couponCode.toUpperCase()})</span><span className="summary-card__val">- {formatPrice(discount, lang)}</span></div>}
                    <div className="summary-card__divider" />
                    <div className="summary-card__row summary-card__row--total"><span className="summary-card__label-total">{dict.cart.total_amount}</span><span className="summary-card__val-total">{formatPrice(totalAmount, lang)}</span></div>
                </div>

                <div className="order__data">
                    <div className="payment__methods">
                        {/* <button type="button" className={method == 'wallet' ? 'payment-btn selected' : 'payment-btn'} onClick={() => setMethod('wallet')}>{dict.cart.payment_wallet}</button> */}
                        <button type="button" className={method == 'instapay' ? 'payment-btn selected' : 'payment-btn'} onClick={() => setMethod('instapay')}>{dict.cart.payment_instapay}</button>
                        <button type="button" className={method == 'cash_on_delivery' ? 'payment-btn selected' : 'payment-btn'} onClick={() => setMethod('cash_on_delivery')}>{dict.cart.payment_cash}</button>
                    </div>
                    <input type="text" className="form-input" placeholder={dict.cart.shipping_placeholder} value={shippingInput} onChange={(e) => setShippingInput(e.target.value)} style={{ padding: '8px', marginTop: '10px', width: '100%' }} />
                    <ShippingNotice phone={contactPhone} />

                    {method && method !== 'cash_on_delivery' && (
                        <>
                            <p className="order__instapay">{dict.cart.instapay_number}: <strong>{instapay}</strong></p>
                            <div className="file-upload">
                                <label className="file-upload__label">
                                    <input type="file" accept="image/*" className="file-input" onChange={(e) => { const f = e.target.files?.[0] || null; setScreenshot(f); setFileName(f ? f.name : dict.cart.no_file); setPreview(f ? URL.createObjectURL(f) : null); }} />
                                    <span className="file-upload__button">{dict.cart.upload_screenshot}</span>
                                    <span className="file-upload__text">{fileName}</span>
                                </label>
                                {preview && <div className="file-upload__preview"><img src={preview} alt="preview" /><button type="button" onClick={() => { setScreenshot(null); setPreview(null); setFileName(dict.cart.no_file) }}>×</button></div>}
                            </div>
                        </>
                    )}

                    <div style={{ margin: '16px 0', display: 'flex', gap: '8px' }}>
                        <input type="text" className="form-input" placeholder={dict.cart.coupon_placeholder} value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} disabled={!!couponData} style={{ flex: 1, textTransform: 'uppercase' }} />
                        {!couponData ? <button type="button" onClick={handleApply} disabled={applying || !couponCode} className="payment-btn" style={{ padding: '8px 16px' }}>{applying ? '...' : dict.cart.apply}</button>
                        : <button type="button" onClick={handleRemove} className="payment-btn" style={{ background: '#fee2e2', color: '#dc2626' }}>{dict.cart.remove}</button>}
                    </div>
                    {couponError && <p style={{ color: '#dc2626', fontSize: '15px', margin: '-8px 0 12px' }}>{couponError}</p>}
                    {couponData && <p style={{ color: '#16a34a', fontSize: '15px', margin: '-8px 0 12px' }}>✓ {dict.cart.coupon_applied}</p>}
                </div>

                <button type="button" className="checkout-btn" onClick={submit} disabled={submiting}>{submiting ? dict.cart.proceeding : dict.cart.checkout}</button>
            </div>
        </aside>
    );
}