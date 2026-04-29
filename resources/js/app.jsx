import './bootstrap';
import '../css/app.css';
import "@shopify/polaris/build/esm/styles.css";
import { createInertiaApp } from '@inertiajs/react';
import { AppProvider } from '@shopify/polaris';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import enTranslations from '@shopify/polaris/locales/en.json';


const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        // Server may return component names with a folder prefix (e.g. "Pages/MainDashboard" or "Embedded/SomePage").
        // If so, resolve to `./<ReturnedName>.jsx`. Otherwise resolve to `./Pages/<name>.jsx`.
        const path = name.includes('/') ? `./${name}.jsx` : `./Pages/${name}.jsx`;
        return resolvePageComponent(path, import.meta.glob('./Pages/**/*.jsx'));
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<AppProvider i18n={enTranslations}>
            <App {...props} />
        </AppProvider>);
    },
    progress: {
        color: '#4B5563',
    },
});
