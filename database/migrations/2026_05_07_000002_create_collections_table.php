<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collections', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('shopify_collection_id')->nullable()->unique();
            $table->string('title')->nullable();
            $table->string('handle')->nullable();
            $table->string('collection_type')->default('custom'); // 'custom' or 'smart'
            $table->timestamps();

            $table->index('user_id');
        });

        Schema::create('collection_product', function (Blueprint $table) {
            $table->unsignedBigInteger('collection_id');
            $table->unsignedBigInteger('product_id');
            $table->primary(['collection_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collection_product');
        Schema::dropIfExists('collections');
    }
};
