import { defineConfig } from 'cypress';

export default defineConfig({
    component: {
        devServer: {
            framework: 'create-react-app',
            bundler: 'webpack',
        },
        specPattern: '**/*.cy.{js,jsx,ts,tsx}',
    },
});
