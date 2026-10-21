<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $defaults = [
            'site_name' => 'BEITY',
            'site_tagline' => 'كل حاجة لبيتي',
            'contact_email' => 'info@beity.com',
            'contact_phone' => '01000000000',
            'shipping_cost' => '15',
            'free_shipping_min' => '500',
            'instapay_number' => '01000000000',
        ];
        foreach($defaults as $k => $v) Setting::firstOrCreate(['key' => $k], ['value' => $v]);
    }
}
