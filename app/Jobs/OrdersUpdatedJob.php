<?php

namespace App\Jobs;


use stdClass;
use App\Models\User;
use App\Http\Traits\ResponseTrait;
use App\Http\Traits\ShopifyOrderTrait;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Osiset\ShopifyApp\Objects\Values\ShopDomain;
use App\Repositories\Order\OrderRepositoryInterface;
use Osiset\ShopifyApp\Contracts\Queries\Shop as IShopQuery;

class OrdersUpdatedJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels, ResponseTrait, ShopifyOrderTrait;

    /**
     * Create a new job instance.
     *  @var ShopDomain|string
     */
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
     */
    public function handle(IShopQuery $shopQuery)
    {
        $this->shopDomain = ShopDomain::fromNative($this->shopDomain);
        $shop = $shopQuery->getByDomain($this->shopDomain);
        $domain = $this->shopDomain->toNative();
        if (!$shop) {
            $this->logInfo('Order update skipped: shop not found for domain ' . $domain);
            return;
        }

        $user = User::where('name', $domain)->first();
        if (!$user) {
            $this->logInfo('Order update skipped: user not found for shop ' . $domain);
            return;
        }

        $payload = $this->data;

        $this->getOrderRepository(app(OrderRepositoryInterface::class));

        if ($this->storeData($payload, $user, true)) {
            $this->logInfo("Order Update Job Successfully");
        } else {
            $this->logInfo("Order Update Job Failed");
        }
    }
}
