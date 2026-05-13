<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <base target="_top">
        <meta name="shopify-api-key" content="{{ config('shopify-app.api_key') }}" />
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>

        <title>Redirecting...</title>

        <script type="text/javascript">
            document.addEventListener('DOMContentLoaded', function () {
                let redirectUrl = "{!! $url !!}";
                const apiKey = document.querySelector('meta[name="shopify-api-key"]')?.content;
                const host = new URLSearchParams(window.location.search).get('host');

                const fallbackRedirect = () => {
                    if (window.top === window.self) {
                        window.location.assign(redirectUrl);
                    } else {
                        window.open(redirectUrl, '_top');
                    }
                };

                try {
                    const AppBridge = window['app-bridge'];
                    const createApp = AppBridge?.default || AppBridge?.createApp;
                    const Redirect = AppBridge?.actions?.Redirect;

                    if (createApp && Redirect && host && apiKey) {
                        const app = createApp({ apiKey, host, forceRedirect: true });
                        Redirect.create(app).dispatch(Redirect.Action.REMOTE, redirectUrl);
                        return;
                    }
                } catch (e) {
                    // Fallback below handles navigation.
                }

                fallbackRedirect();
            });
        </script>
    </head>
    <body>
    </body>
</html>
