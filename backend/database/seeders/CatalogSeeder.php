<?php

namespace Database\Seeders;

use App\Models\Categories\Category;
use App\Models\Products\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CatalogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->seedCategories();

        $this->command->info('Categories in DB: ' . Category::count());
        $this->command->info('Category translations in DB: ' . DB::table('category_translations')->count());

        $this->seedProducts();
    }

    protected function seedCategories(): void
    {
        $categories = [
            [
                'en' => [
                    'name' => 'Refrigerators',
                ],
                'ar' => [
                    'name' => 'ثلاجات',
                ],
            ],
            [
                'en' => [
                    'name' => 'Washing Machines',
                ],
                'ar' => [
                    'name' => 'غسالات ملابس',
                ],
            ],
            [
                'en' => [
                    'name' => 'Air Conditioners',
                ],
                'ar' => [
                    'name' => 'مكيفات هواء',
                ],
            ],
            [
                'en' => [
                    'name' => 'Microwaves',
                ],
                'ar' => [
                    'name' => 'أفران ميكروويف',
                ],
            ],
            [
                'en' => [
                    'name' => 'Televisions',
                ],
                'ar' => [
                    'name' => 'تلفزيونات',
                ],
            ],
            [
                'en' => [
                    'name' => 'Vacuum Cleaners',
                ],
                'ar' => [
                    'name' => 'مكانس كهربائية',
                ],
            ],
            [
                'en' => [
                    'name' => 'Water Heaters',
                ],
                'ar' => [
                    'name' => 'سخانات مياه',
                ],
            ],
            [
                'en' => [
                    'name' => 'Blenders & Mixers',
                ],
                'ar' => [
                    'name' => 'خلاطات وعجانات',
                ],
            ],
            [
                'en' => [
                    'name' => 'Fans',
                ],
                'ar' => [
                    'name' => 'مراوح',
                ],
            ],
            [
                'en' => [
                    'name' => 'Ovens & Cookers',
                ],
                'ar' => [
                    'name' => 'أفران وطباخات',
                ],
            ],
        ];

        foreach ($categories as $categoryData) {
            $category = Category::whereTranslation('name', $categoryData['en']['name'], 'en')->first()
                ?? new Category();

            foreach (['en', 'ar'] as $locale) {
                $category->translateOrNew($locale)->name = $categoryData[$locale]['name'];
                $category->translateOrNew($locale)->slug = generateSlug($categoryData[$locale]['name']);
            }
            $category->save();
        }
    }

    protected function seedProducts(): void
    {
        $products = [
            'Refrigerators' => [
                [
                    'en' => ['name' => 'Samsung 500L Double Door Refrigerator', 'description' => 'Spacious double-door refrigerator with digital inverter technology and frost-free cooling.'],
                    'ar' => ['name' => 'ثلاجة سامسونج بابين 500 لتر', 'description' => 'ثلاجة واسعة بابين مزودة بتقنية الإنفرتر الرقمي وتبريد بدون تجميد.'],
                    'price' => 850.00, 'stock' => 25,
                ],
                [
                    'en' => ['name' => 'LG 420L Single Door Refrigerator', 'description' => 'Compact single-door refrigerator with smart inverter compressor for energy savings.'],
                    'ar' => ['name' => 'ثلاجة إل جي باب واحد 420 لتر', 'description' => 'ثلاجة مدمجة بباب واحد مزودة بضاغط إنفرتر ذكي لتوفير الطاقة.'],
                    'price' => 620.00, 'stock' => 30,
                ],
                [
                    'en' => ['name' => 'Bosch Side by Side Refrigerator 600L', 'description' => 'Premium side-by-side refrigerator with No Frost technology and water dispenser.'],
                    'ar' => ['name' => 'ثلاجة بوش جنباً إلى جنب 600 لتر', 'description' => 'ثلاجة فاخرة جنباً إلى جنب بتقنية No Frost وموزع مياه.'],
                    'price' => 1450.00, 'stock' => 12,
                ],
                [
                    'en' => ['name' => 'Toshiba Mini Bar Refrigerator 90L', 'description' => 'Compact mini refrigerator perfect for offices and small spaces.'],
                    'ar' => ['name' => 'ثلاجة توشيبا ميني بار 90 لتر', 'description' => 'ثلاجة صغيرة مثالية للمكاتب والمساحات الضيقة.'],
                    'price' => 210.00, 'stock' => 40,
                ],
            ],
            'Washing Machines' => [
                [
                    'en' => ['name' => 'LG 9kg Front Load Washing Machine', 'description' => 'Front load washer with AI Direct Drive motor and steam cleaning function.'],
                    'ar' => ['name' => 'غسالة إل جي تحميل أمامي 9 كجم', 'description' => 'غسالة تحميل أمامي بمحرك AI Direct Drive وميزة التنظيف بالبخار.'],
                    'price' => 780.00, 'stock' => 18,
                ],
                [
                    'en' => ['name' => 'Samsung 12kg Top Load Washing Machine', 'description' => 'Large capacity top load washer with digital inverter and diamond drum.'],
                    'ar' => ['name' => 'غسالة سامسونج تحميل علوي 12 كجم', 'description' => 'غسالة تحميل علوي بسعة كبيرة مزودة بإنفرتر رقمي وحلة الماس.'],
                    'price' => 690.00, 'stock' => 22,
                ],
                [
                    'en' => ['name' => 'Whirlpool 7kg Semi-Automatic Washing Machine', 'description' => 'Reliable semi-automatic washer with twin tub design for efficient washing and drying.'],
                    'ar' => ['name' => 'غسالة ويرلبول نصف أوتوماتيك 7 كجم', 'description' => 'غسالة نصف أوتوماتيكية موثوقة بتصميم حوضين للغسيل والتجفيف بكفاءة.'],
                    'price' => 320.00, 'stock' => 35,
                ],
            ],
            'Air Conditioners' => [
                [
                    'en' => ['name' => 'Carrier 1.5 Ton Split Air Conditioner', 'description' => 'Energy-efficient split AC unit with inverter technology and rapid cooling mode.'],
                    'ar' => ['name' => 'مكيف كاريير سبليت 1.5 طن', 'description' => 'وحدة تكييف سبليت موفرة للطاقة بتقنية الإنفرتر ووضع التبريد السريع.'],
                    'price' => 540.00, 'stock' => 28,
                ],
                [
                    'en' => ['name' => 'Gree 2 Ton Split Air Conditioner', 'description' => 'Powerful split air conditioner suitable for large rooms with low-noise operation.'],
                    'ar' => ['name' => 'مكيف جري سبليت 2 طن', 'description' => 'مكيف سبليت قوي مناسب للغرف الكبيرة بتشغيل منخفض الضوضاء.'],
                    'price' => 720.00, 'stock' => 20,
                ],
                [
                    'en' => ['name' => 'Fresh Window Air Conditioner 1.5 Ton', 'description' => 'Compact window AC unit with mechanical control and quick installation.'],
                    'ar' => ['name' => 'مكيف فريش شباك 1.5 طن', 'description' => 'وحدة تكييف شباك مدمجة بتحكم ميكانيكي وتركيب سريع.'],
                    'price' => 380.00, 'stock' => 25,
                ],
            ],
            'Microwaves' => [
                [
                    'en' => ['name' => 'Panasonic 25L Solo Microwave Oven', 'description' => 'Simple and efficient solo microwave with 6 power levels for everyday cooking.'],
                    'ar' => ['name' => 'ميكروويف باناسونيك سولو 25 لتر', 'description' => 'ميكروويف سولو بسيط وفعال مزود بـ 6 مستويات طاقة للطهي اليومي.'],
                    'price' => 95.00, 'stock' => 45,
                ],
                [
                    'en' => ['name' => 'Samsung 32L Convection Microwave Oven', 'description' => 'Multi-function microwave with convection baking, grilling, and steam cleaning.'],
                    'ar' => ['name' => 'ميكروويف سامسونج بالحمل الحراري 32 لتر', 'description' => 'ميكروويف متعدد الوظائف بخاصية الخبز بالحمل الحراري والشوي والتنظيف بالبخار.'],
                    'price' => 165.00, 'stock' => 30,
                ],
            ],
            'Televisions' => [
                [
                    'en' => ['name' => 'Samsung 55" Crystal UHD 4K Smart TV', 'description' => 'Stunning 4K resolution with crystal processor and built-in smart hub for streaming.'],
                    'ar' => ['name' => 'تلفزيون سامسونج ذكي 55 بوصة 4K', 'description' => 'دقة 4K مذهلة مع معالج كريستال ومنصة ذكية مدمجة للبث المباشر.'],
                    'price' => 620.00, 'stock' => 15,
                ],
                [
                    'en' => ['name' => 'LG 65" OLED 4K Smart TV', 'description' => 'Premium OLED display with self-lit pixels for perfect blacks and infinite contrast.'],
                    'ar' => ['name' => 'تلفزيون إل جي أوليد ذكي 65 بوصة', 'description' => 'شاشة أوليد فاخرة ببكسلات ذاتية الإضاءة لأسود مثالي وتباين لا نهائي.'],
                    'price' => 1350.00, 'stock' => 8,
                ],
                [
                    'en' => ['name' => 'TCL 43" Full HD Smart TV', 'description' => 'Affordable smart TV with Full HD display and built-in streaming apps.'],
                    'ar' => ['name' => 'تلفزيون تي سي إل ذكي 43 بوصة', 'description' => 'تلفزيون ذكي بسعر مناسب بدقة Full HD وتطبيقات بث مدمجة.'],
                    'price' => 280.00, 'stock' => 24,
                ],
            ],
            'Vacuum Cleaners' => [
                [
                    'en' => ['name' => 'Dyson V11 Cordless Vacuum Cleaner', 'description' => 'Powerful cordless stick vacuum with intelligent suction and LCD screen.'],
                    'ar' => ['name' => 'مكنسة دايسون V11 لاسلكية', 'description' => 'مكنسة عصا لاسلكية قوية بشفط ذكي وشاشة LCD.'],
                    'price' => 480.00, 'stock' => 16,
                ],
                [
                    'en' => ['name' => 'Philips PowerPro Bagless Vacuum Cleaner', 'description' => 'Bagless canister vacuum with strong suction power and compact design.'],
                    'ar' => ['name' => 'مكنسة فيليبس باور برو بدون كيس', 'description' => 'مكنسة أسطوانية بدون كيس بقوة شفط عالية وتصميم مدمج.'],
                    'price' => 145.00, 'stock' => 26,
                ],
            ],
            'Water Heaters' => [
                [
                    'en' => ['name' => 'Ariston 50L Electric Water Heater', 'description' => 'Reliable electric water heater with titanium enamel tank and thermostat control.'],
                    'ar' => ['name' => 'سخان مياه أريستون كهربائي 50 لتر', 'description' => 'سخان مياه كهربائي موثوق بخزان مطلي بالتيتانيوم وتحكم بالثرموستات.'],
                    'price' => 130.00, 'stock' => 32,
                ],
                [
                    'en' => ['name' => 'Ferroli 80L Electric Water Heater', 'description' => 'Large capacity water heater ideal for families, with safety valve and fast heating.'],
                    'ar' => ['name' => 'سخان مياه فيروللي كهربائي 80 لتر', 'description' => 'سخان مياه بسعة كبيرة مثالي للعائلات، مزود بصمام أمان وتسخين سريع.'],
                    'price' => 175.00, 'stock' => 20,
                ],
            ],
            'Blenders & Mixers' => [
                [
                    'en' => ['name' => 'Kenwood Multi-Function Blender 1.5L', 'description' => 'Powerful blender with multiple speed settings, ideal for smoothies and sauces.'],
                    'ar' => ['name' => 'خلاط كينوود متعدد الوظائف 1.5 لتر', 'description' => 'خلاط قوي بإعدادات سرعة متعددة، مثالي للعصائر والصلصات.'],
                    'price' => 65.00, 'stock' => 50,
                ],
                [
                    'en' => ['name' => 'Braun Stand Mixer 1000W', 'description' => 'Professional stand mixer with dough hook, whisk, and beater attachments.'],
                    'ar' => ['name' => 'عجانة براون ثابتة 1000 واط', 'description' => 'عجانة ثابتة احترافية مزودة بملحقات خطاف العجين والمضرب والخفاقة.'],
                    'price' => 190.00, 'stock' => 18,
                ],
            ],
            'Fans' => [
                [
                    'en' => ['name' => 'Toshiba Ceiling Fan 56 Inch', 'description' => 'Durable ceiling fan with 3-speed settings and energy-efficient motor.'],
                    'ar' => ['name' => 'مروحة سقف توشيبا 56 بوصة', 'description' => 'مروحة سقف متينة بإعدادات 3 سرعات ومحرك موفر للطاقة.'],
                    'price' => 55.00, 'stock' => 40,
                ],
                [
                    'en' => ['name' => 'Fresh Stand Fan 18 Inch', 'description' => 'Adjustable stand fan with oscillation feature and 3-speed control.'],
                    'ar' => ['name' => 'مروحة فريش أرضية 18 بوصة', 'description' => 'مروحة أرضية قابلة للتعديل بخاصية الحركة الأفقية وتحكم 3 سرعات.'],
                    'price' => 32.00, 'stock' => 55,
                ],
            ],
            'Ovens & Cookers' => [
                [
                    'en' => ['name' => 'Fresh Gas Cooker 5 Burners', 'description' => 'Full-size gas cooker with 5 burners, gas oven, and safety valve.'],
                    'ar' => ['name' => 'طباخ فريش غاز 5 شعلات', 'description' => 'طباخ غاز بحجم كامل مزود بـ 5 شعلات وفرن غاز وصمام أمان.'],
                    'price' => 245.00, 'stock' => 15,
                ],
                [
                    'en' => ['name' => 'Zanussi Built-In Electric Oven 60cm', 'description' => 'Built-in electric oven with multifunction cooking modes and digital timer.'],
                    'ar' => ['name' => 'فرن زانوسي كهربائي مدمج 60 سم', 'description' => 'فرن كهربائي مدمج بأوضاع طهي متعددة الوظائف ومؤقت رقمي.'],
                    'price' => 310.00, 'stock' => 12,
                ],
            ],
        ];

        foreach ($products as $categoryName => $items) {
            $category = Category::whereTranslation('name', $categoryName, 'en')->first();

            if (! $category) {
                $this->command->warn("Category not found, skipping: {$categoryName}");
                continue;
            }

            foreach ($items as $item) {
                $existing = Product::whereTranslation('name', $item['en']['name'], 'en')->first();

                if ($existing) {
                    $this->command->warn("Product already exists, skipping: {$item['en']['name']}");
                    continue;
                }

                $this->command->info("Creating product: {$item['en']['name']}");

                $product = Product::create([
                    'category_id' => $category->id,
                    'price' => $item['price'],
                    'stock' => $item['stock'],
                    'is_active' => true,
                    'sku' => 'SKU-' . strtoupper(Str::random(6)),
                ]);

                foreach (['en', 'ar'] as $locale) {
                    $product->translateOrNew($locale)->name = $item[$locale]['name'];
                    $product->translateOrNew($locale)->description = $item[$locale]['description'];
                    $product->translateOrNew($locale)->slug = generateSlug($item[$locale]['name']);
                }
                $product->save();
            }
        }
    }
}