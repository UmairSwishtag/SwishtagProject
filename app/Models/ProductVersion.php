<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Products\Product;

class ProductVersion extends Model
{
    protected $fillable = [
        'product_id',
        'variant_id',
        'changed_field',
        'old_value',
        'new_value',
        'source',
        'changed_at',
    ];

    protected $casts = [
        'changed_at' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function variant()
    {
        return $this->belongsTo(\App\Models\Products\ProductVarient::class, 'variant_id');
    }
}
