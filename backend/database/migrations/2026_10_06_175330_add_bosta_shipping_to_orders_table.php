<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->json('bosta_address')->nullable();
            $table->string('bosta_submission_status')->nullable()->index();
            $table->string('bosta_delivery_id')->nullable()->unique();
            $table->string('bosta_tracking_number')->nullable();
            $table->text('bosta_error')->nullable();
            $table->timestamp('bosta_submitted_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropUnique(['bosta_delivery_id']);
            $table->dropIndex(['bosta_submission_status']);
            $table->dropColumn(['bosta_address', 'bosta_submission_status', 'bosta_delivery_id', 'bosta_tracking_number', 'bosta_error', 'bosta_submitted_at']);
        });
    }
};
