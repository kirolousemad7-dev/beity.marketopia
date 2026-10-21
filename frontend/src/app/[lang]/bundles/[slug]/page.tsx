import { notFound } from 'next/navigation';
import { fetchBundleBySlug, fetchBundles } from '@/lib/api';
import BundleDetailsContent from '@/components/bundles/bundle-details-content';

interface PageProps {
    params: {
        slug: string;
        lang: "ar" | "en";
    };
}

export async function generateStaticParams() {
    const bundles = await fetchBundles('en');

    if (!bundles || bundles.length === 0) {
        console.warn('No bundles returned from API during build, returning empty array');
        return [
            { lang: 'en', slug: 'placeholder' },
            { lang: 'ar', slug: 'placeholder' },
        ];
    }

    return bundles.flatMap((bundle) => [
        {
            lang: 'en',
            slug: bundle.slug,
        },
        {
            lang: 'ar',
            slug: bundle.slug,
        },
    ]);
}

export default async function BundleDetailPage({ params }: PageProps) {
    const { lang, slug } = await params;
    let bundle = null;
    try {
        bundle = await fetchBundleBySlug(slug, lang);
    } catch (error) {
        console.error(`Error loading bundle [${slug}] from @/lib/api:`, error);
    }

    console.log('Bundle Data: ', bundle)

    if (!bundle) {
        notFound();
    }

    return <BundleDetailsContent bundle={bundle} lang={lang} />
}