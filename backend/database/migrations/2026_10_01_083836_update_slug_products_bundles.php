<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bundles', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('id')->unique();
        });
        
        DB::table('bundle_translations')->where('locale', 'en')->select('bundle_id', 'slug')->get()->each(function ($translation) {
            DB::table('bundles')->where('id', $translation->bundle_id)->update(['slug' => $translation->slug]);
        });

        Schema::table('bundle_translations', function (Blueprint $table) {
            $table->dropColumn('slug');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('id')->unique();
        });
        
        DB::table('product_translations')->where('locale', 'en')->select('product_id', 'slug')->get()->each(function ($translation) {
            DB::table('products')->where('id', $translation->product_id)->update(['slug' => $translation->slug]);
        });

        Schema::table('product_translations', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bundles', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
        Schema::table('bundle_translations', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('name')->unique();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
        Schema::table('product_translations', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('name')->unique();
        });
    }
};
