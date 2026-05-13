<?php
namespace App\Jobs;

use Log;
use stdClass;
use App\Models\User;
use Illuminate\Bus\Queueable;
use App\Http\Traits\ResponseTrait;
use Illuminate\Queue\SerializesModels;
use App\Http\Traits\ShopifyProductTrait;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Osiset\ShopifyApp\Objects\Values\ShopDomain;
use App\Repositories\Product\ProductRepositoryInterface;
use Osiset\ShopifyApp\Contracts\Queries\Shop as IShopQuery;

class ProductsUpdateJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels, ShopifyProductTrait, ResponseTrait;

    /**
     * Shop's myshopify domain
     *
     * @var ShopDomain|string
     */
    public $shopDomain;

    /**
     * The webhook data
     *
     * @var object
     */
    public $data;

    /**
     * Create a new job instance.
     *
     * @param string   $shopDomain The shop's myshopify domain.
     * @param stdClass $data       The webhook data (JSON decoded).
     *
     * @return void
     */
    public function __construct($shopDomain, $data)
    {
        $this->shopDomain = $shopDomain;
        $this->data = $data;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle(IShopQuery $shopQuery)
    {
        $this->shopDomain = ShopDomain::fromNative($this->shopDomain);
        $shop = $shopQuery->getByDomain($this->shopDomain);
        $domain = $this->shopDomain->toNative();
        if (!$shop) {
            $this->logInfo('Product update skipped: shop not found for domain ' . $domain);
            return;
        }

        $user = User::where('name', $domain)->first();
        if (!$user) {
            $this->logInfo('Product update skipped: user not found for shop ' . $domain);
            return;
        }

        $payload = $this->data;
        $this->getProductRepository(app(ProductRepositoryInterface::class));

        if ($this->storeData($payload, $user)) {
            $this->logInfo("Product Update Job Successfull.");
        } else {
            $this->logInfo("Product Update Job Failed");
        }
    }
}
