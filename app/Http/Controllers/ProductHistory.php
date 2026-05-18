<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProductHistory extends Controller
{
   // Store Front Products insights Updates Starts
    public function insight(Request $request)
{
    $productId = $request->product_id;

    $change = ProductHistory::where('product_id', $productId)
        ->latest()
        ->first();

    if (!$change) {
        return response()->json([
            'message' => 'No recent changes'
        ]);
    }

    return response()->json([
        'message' => $change->change_message
    ]);
}
    // Store Front Products insights Updates Ends
}
