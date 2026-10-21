import { Bundle } from '@/lib/types';
import { Dictionary } from '@/i18n/getDictionary';
import { Locale } from '@/i18n/config';
import BundleSlider from './bundle-slider';
import styles from './bundle_section.module.css';

interface BundleProps {
  bundles: Bundle[];
  lang: Locale;
  dict: Dictionary;
}

export default function BundlesSection({ bundles, lang, dict }: BundleProps) {
  if (!bundles || bundles.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headingBlock}>
            <div className={styles.badgeWrapper}>
              <span className={styles.badge}>{dict.bundles.badge}</span>
            </div>
            <h2 className={styles.title}>
              {dict.bundles.title}
              <span className={styles.titleAccent}> {dict.bundles.titleAccent}</span>
            </h2>
            <p className={styles.subtitle}>
              {dict.bundles.subtitle}
            </p>
          </div>
        </div>

        <BundleSlider bundles={bundles} lang={lang} dict={dict} />
      </div>
    </section>
  );
}