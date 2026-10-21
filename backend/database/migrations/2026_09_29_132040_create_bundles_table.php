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
        Schema::create('bundles', function (Blueprint $table) {
            $table->id();
            $table->decimal('bundle_price');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('bundle_translations', function (Blueprint $table) {
            $table->id();

            $table->string('locale');
            $table->foreignId('bundle_id')->constrained('bundles')->cascadeOnDelete();

            $table->string('title');
            $table->string('slug');
            $table->text('description')->nullable();

            $table->index(['locale', 'bundle_id']);
        });

        Schema::create('bundle_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('bundle_id')->constrained('bundles')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->tinyInteger('quantity')->default(1);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bundle_translations');
        Schema::dropIfExists('bundle_items');
        Schema::dropIfExists('bundles');
    }
};
