'use strict';
const periodic = require('periodicjs');
const PathRegExp = require('path-to-regexp');
const route_prefixes = require('./route_prefixes');
const generateDetailManifests = require('./detail_views/index').generateManifest;
const ROUTE_MAP = new Map();

function getSettings() {
  return periodic.settings.extensions['periodicjs.ext.reactapp'];
}

function getParameterized(route) {
  if (ROUTE_MAP.has(route)) return ROUTE_MAP.get(route);
  else {
    let keys = [];
    let result = new PathRegExp(route, keys);
    ROUTE_MAP.set(route, {
      re: result,
      keys,
    });
    return { keys, re: result, };
  }
}

function findMatchingRoute(routes, location) {
  let matching;
  location = (/\?[^\s]+$/.test(location)) ? location.replace(/^([^\s\?]+)\?[^\s]+$/, '$1') : location;
  Object.keys(routes).forEach(key => {
    let result = getParameterized(key);
    if (result.re.test(location) && !matching) matching = key;
  });
  return matching;
}

function reactapp() {
  const extensionConfig = getSettings();
  const reactappConfig = {
    settings: extensionConfig,
    route_prefix: route_prefixes.route_prefix(extensionConfig.adminPath),
    admin_prefix: route_prefixes.admin_prefix(extensionConfig.adminPath),
    manifest_prefix: route_prefixes.manifest_prefix(extensionConfig.adminPath),
  };

  periodic.app.locals.theme_name = periodic.settings.container.name;
  periodic.app.locals.adminPath = extensionConfig.adminPath;
  // periodic.app.locals.extension = Object.assign({}, periodic.app.locals.extension, {
  //   reactapp: reactappConfig,
  // });
  return reactappConfig;
}
module.exports = {
  getSettings,
  getParameterized,
  findMatchingRoute,
  reactapp,
  generateDetailManifests,
};