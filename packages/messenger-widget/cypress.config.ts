import { defineConfig } from 'cypress';

export default defineConfig({
    component: {
        devServer: {
            framework: 'create-react-app',
            bundler: 'webpack',
            webpackConfig: require('./webpack.config'),
        },
        specPattern: '**/*.cy.{js,jsx,ts,tsx}',
    },
});
