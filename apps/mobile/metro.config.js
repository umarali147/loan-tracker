const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Allow Metro to follow pnpm's symlinks and walk up through node_modules
config.resolver.disableHierarchicalLookup = false;
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// Force singletons to this app's copies. In the monorepo, web pulls react@19
// while mobile uses react@18; shared deps (e.g. zustand) may otherwise nest a
// second React, causing "Cannot read property 'useCallback' of null" at runtime.
const FORCE_SINGLETON = ["react", "react-dom", "react-native"];
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const pkg = FORCE_SINGLETON.find(
    (p) => moduleName === p || moduleName.startsWith(p + "/")
  );
  if (pkg) {
    const rest = moduleName.slice(pkg.length); // "" or "/jsx-runtime" etc.
    return context.resolveRequest(
      context,
      path.resolve(projectRoot, "node_modules", pkg) + rest,
      platform
    );
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
