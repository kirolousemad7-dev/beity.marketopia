<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class StorefrontPagesTest extends TestCase
{
    public static function pages(): array
    {
        $pages = ['', '/products', '/products/new-product', '/bundles', '/bundles/new-bundle', '/cart', '/login', '/register', '/account', '/orders'];
        $cases = [];
        foreach (['en', 'ar'] as $locale) {
            foreach ($pages as $page) {
                $cases[$locale.$page] = [$locale, $page];
            }
        }

        return $cases;
    }

    #[DataProvider('pages')]
    public function test_pages_render_without_server_side_api_requests(string $locale, string $page): void
    {
        Http::preventStrayRequests();
        $this->get('/'.$locale.$page)
            ->assertOk()
            ->assertSee('lang="'.$locale.'"', false)
            ->assertSee('dir="'.($locale === 'ar' ? 'rtl' : 'ltr').'"', false)
            ->assertSee('id="storefront-config"', false)
            ->assertSee('assets/vendor/jquery.min.js')
            ->assertSee('assets/js/app.js')
            ->assertDontSee('_next/');
        Http::assertNothingSent();
    }

    public function test_root_uses_configured_locale(): void
    {
        config(['storefront.default_locale' => 'ar']);
        $this->get('/')->assertRedirect('/ar');
    }

    public function test_unsupported_locales_and_routes_return_not_found(): void
    {
        $this->get('/fr/products')->assertNotFound();
        $this->get('/en/missing')->assertNotFound();
    }

    public function test_unknown_product_slugs_still_render_a_browser_loaded_shell(): void
    {
        $this->get('/en/products/not-in-build')->assertOk()->assertSee('data-product-content', false);
    }

    public function test_bootstrap_configuration_cannot_break_out_of_script_element(): void
    {
        config(['storefront.api_url' => 'https://example.test/</script><script>alert(1)</script>']);
        $this->get('/en')->assertOk()->assertDontSee('<script>alert(1)</script>', false)->assertSee('\\u003C', false);
    }
}
