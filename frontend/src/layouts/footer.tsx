import Link from "next/link";
import Image from "next/image";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa6";
import type { Locale } from "@/i18n/config";
import { Dictionary } from "@/i18n/getDictionary";
import { Settings } from "@/lib/types";

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61593908945987", Icon: FaFacebookF },
  { label: "Instagram", href: "https://www.instagram.com/beity.home.eg/", Icon: FaInstagram },
  { label: "Tiktok", href: "https://www.tiktok.com/@beityhomestore", Icon: FaTiktok },
];

export function Footer({
  lang,
  dict,
  settings,
}: {
  lang: Locale;
  dict: Dictionary;
  settings: Settings;
}) {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">

          <div className="footer__brand">
            <Link href={`/${lang}`} className="footer__logo-link">
              <Image
                src="/logo.png"
                alt="Beity | بيتي"
                height={40}
                width={120}
                className="footer__logo"
              />
            </Link>
            <p className="footer__tagline">{dict.footer.tagline}</p>
            <div className="footer__social">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  className="footer__social-link"
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          <nav className="footer__col" aria-label={dict.footer.shop}>
            <h3 className="footer__heading">{dict.footer.shop}</h3>
            <ul className="footer__list">
              <li>
                <Link href={`/${lang}/products`} className="footer__link">
                  {dict.footer.catalog}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/cart`} className="footer__link">
                  {dict.footer.cart}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/orders`} className="footer__link">
                  {dict.footer.orders}
                </Link>
              </li>
            </ul>
          </nav>

          <div className="footer__col" aria-label={dict.footer.contacts}>
            <h3 className="footer__heading">{dict.footer.contacts}</h3>
            <ul className="footer__list">
              <li>
                <a href={`tel:${settings?.contact_phone}`} className="footer__link footer__link--contact" dir="ltr">
                  {settings?.contact_phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${settings?.contact_email}`} className="footer__link footer__link--contact">
                  {settings?.contact_email}
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">
            &copy; 2026 Marketopia. {dict.footer.copyright}
          </p>
        </div>

      </div>
    </footer>
  );
}