<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('settings', function(Blueprint $table) {
            $table->id();
            $table->string('key');
            $table->string('value');
        });

        Schema::table('products', function(Blueprint $table) {
            $table->decimal('price_after_discount', 10, 2)->after('price')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
        Schema::table('products', function(Blueprint $table) {
            $table->dropColumn('price_after_discount');
        });
    }
};
