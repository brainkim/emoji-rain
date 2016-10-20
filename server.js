import http from 'http';
import express from 'express';
import path from 'path';

import webpack from 'webpack';
import webpackDev from 'webpack-dev-middleware';
import webpackHot from 'webpack-hot-middleware';
import webpackConfig from './webpack/webpack.config.js';

const compiler = webpack(webpackConfig);

import Dashboard from 'webpack-dashboard';
import DashboardPlugin from 'webpack-dashboard/plugin';
const dashboard = new Dashboard();
compiler.apply(new DashboardPlugin(dashboard.setData));

const app = express();

// Inject webpack dev and hot reload middleware if in development.
if (process.env.NODE_ENV === 'development') {
  app.use(webpackDev(compiler, {
    quiet: true,
    publicPath: webpackConfig.output.publicPath
  }));

  app.use(webpackHot(compiler, {
    log: () => {},
    path: '/__poop',
    heartbeat: 10 * 1000
  }));
}

var server = http.createServer(app);
server.listen(process.env.PORT || 1337, () => {
  console.log("Listening on %j", server.address());
});
