<?php

namespace App\Models\Products;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Collection extends Model
{
    protected $fillable = [
        'user_id',
        'shopify_collection_id',
        'title',
        'handle',
        'collection_type',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'collection_product');
    }
}
