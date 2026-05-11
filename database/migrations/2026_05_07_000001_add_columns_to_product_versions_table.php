<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_versions', function (Blueprint $table) {
            $table->unsignedBigInteger('product_id')->nullable()->after('id');
            $table->unsignedBigInteger('variant_id')->nullable()->after('product_id');
            $table->string('changed_field')->nullable()->after('variant_id');
            $table->text('old_value')->nullable()->after('changed_field');
            $table->text('new_value')->nullable()->after('old_value');
            $table->string('source')->default('webhook')->after('new_value'); // 'webhook' or 'sync'
            $table->timestamp('changed_at')->nullable()->after('source');

            $table->index('product_id');
            $table->index('changed_field');
        });
    }

    public function down(): void
    {
        Schema::table('product_versions', function (Blueprint $table) {
            $table->dropIndex(['product_id']);
            $table->dropIndex(['changed_field']);
            $table->dropColumn([
                'product_id', 'variant_id', 'changed_field',
                'old_value', 'new_value', 'source', 'changed_at',
            ]);
        });
    }
};
