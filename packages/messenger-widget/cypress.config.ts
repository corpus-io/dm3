import { defineConfig } from 'cypress';

export default defineConfig({
    component: {
        devServer: {
            framework: 'create-react-app',
            bundler: 'webpack',
            webpackConfig: require('./webpack.config'),
        },
        specPattern: './src/**/*.cy.{js,jsx,ts,tsx}',
    },
});
