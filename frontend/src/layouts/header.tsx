"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FaCartShopping } from "react-icons/fa6";
import { HiMenu, HiX } from "react-icons/hi";
import { useCart } from "@/context/cart-context";
import type { Locale } from "@/i18n/config";
import { useLocale } from "@/context/locale-context";

export function Header({
  lang,
  dict,
}: {
  lang: Locale;
  dict: {
    header: {
      catalog: string;
      account: string;
      cart: string;
      cartAriaLabel: string;
      pages?: string;
    };
  };
}) {
  const { locale, setLocale } = useLocale();
  const { items = [] } = useCart() || {};
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const totalItems = items.reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );

  const pathWithoutLocale = "/" + (pathname.split("/")[2] ?? "");
  const isActive = (href: string) =>
    href === `/${lang}` ? pathWithoutLocale === "/" : pathWithoutLocale.startsWith(href);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="header">
      <div className="header__inner">
        {/* Brand Logo */}
        <Link href={`/${lang}`} className="header__brand" aria-label="Beity home">
          <Image
            src="/logo.png"
            alt="Beity | بيتي"
            height={40}
            width={120}
            className="header__logo"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="header__nav" aria-label="Main Navigation">
          <Link
            href={`/${lang}/products`}
            className="header__nav-link"
            aria-current={isActive("/products") ? "page" : undefined}
          >
            {dict.header.catalog}
          </Link>

          <Link
            href={`/${lang}/account`}
            className="header__nav-link"
            aria-current={isActive("/account") ? "page" : undefined}
          >
            {dict.header.account}
          </Link>

          {/* Language Switcher */}
          <button
            className="header__lang-btn"
            onClick={() => setLocale(locale === "en" ? "ar" : "en")}
            aria-label="Change language"
          >
            {locale === "en" ? "ع" : "EN"}
          </button>

          {/* Cart Button */}
          <Link
            href={`/${lang}/cart`}
            className="header__cart-btn"
            aria-label={dict.header.cartAriaLabel.replace("{count}", String(totalItems))}
            aria-current={isActive("/cart") ? "page" : undefined}
          >
            <FaCartShopping size={15} />
            <span>{dict.header.cart}</span>
            <span className="header__cart-count">{totalItems}</span>
          </Link>
        </nav>

        {/* Mobile Actions (Cart + Hamburger) */}
        <div className="header__mobile-actions">
          <Link
            href={`/${lang}/cart`}
            className="header__cart-btn header__cart-btn--mobile"
            aria-label="Cart"
          >
            <FaCartShopping size={16} />
            <span className="header__cart-count">{totalItems}</span>
          </Link>

          <button
            className="header__hamburger"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <HiX size={26} /> : <HiMenu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="header__mobile-drawer">
          <Link href={`/${lang}/products`} className="header__mobile-link">
            {dict.header.catalog}
          </Link>
          {/* <Link href={`/${lang}/bundles`} className="header__mobile-link">
            {dict.header.bundles || "Exclusive Bundles"}
          </Link> */}
          <Link href={`/${lang}/account`} className="header__mobile-link">
            {dict.header.account}
          </Link>
          <div className="header__mobile-footer">
            <button
              className="header__lang-btn header__lang-btn--full"
              onClick={() => setLocale(locale === "en" ? "ar" : "en")}
            >
              {locale === "en" ? "العربية (Arabic)" : "English"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}