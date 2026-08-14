function requiredString(value, path, errors) {
  if (typeof value !== "string" || !value.trim()) errors.push(`${path} must be a non-empty string`);
  if (typeof value === "string" && value.trim().toLowerCase() === "missing") {
    errors.push(`${path} must not be Missing`);
  }
}

const ALLOWED_ROUTE_STATUSES = new Set([
  "Implemented baseline — pending first reconciliation",
  "Approved"
]);

const ALLOWED_SHARED_STATUSES = new Set(["Implemented baseline", "Approved"]);

export function validateSnapshot(snapshot, registry) {
  const errors = [];
  const seenIds = new Set();
  let routeContentCount = 0;
  let sharedContentCount = 0;

  if (snapshot?.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!snapshot?.source || typeof snapshot.source !== "object") errors.push("source is required");
  if (!snapshot?.routes || typeof snapshot.routes !== "object") errors.push("routes is required");
  if (!snapshot?.shared || typeof snapshot.shared !== "object") errors.push("shared is required");

  const expectedRouteKeys = Object.keys(registry.routes).sort();
  const actualRouteKeys = Object.keys(snapshot.routes || {}).sort();
  if (expectedRouteKeys.join("|") !== actualRouteKeys.join("|")) {
    errors.push(`route keys differ: expected ${expectedRouteKeys.join(", ")}; received ${actualRouteKeys.join(", ")}`);
  }

  for (const routeKey of expectedRouteKeys) {
    const route = snapshot.routes?.[routeKey];
    const config = registry.routes[routeKey];
    if (!route) continue;

    if (String(route.sourcePage?.id) !== String(config.pageId)) {
      errors.push(`routes.${routeKey}.sourcePage.id must be ${config.pageId}`);
    }
    if (!Number.isInteger(route.sourcePage?.version) || route.sourcePage.version < 1) {
      errors.push(`routes.${routeKey}.sourcePage.version must be a positive integer`);
    }
    if (!ALLOWED_ROUTE_STATUSES.has(route.sourcePage?.status)) {
      errors.push(`routes.${routeKey}.sourcePage.status is not publishable: ${route.sourcePage?.status || "empty"}`);
    }

    requiredString(route.route?.en, `routes.${routeKey}.route.en`, errors);
    requiredString(route.route?.tr, `routes.${routeKey}.route.tr`, errors);
    if (route.route?.en && !route.route.en.startsWith("/en/")) {
      errors.push(`routes.${routeKey}.route.en must start with /en/`);
    }
    if (route.route?.tr && !route.route.tr.startsWith("/tr/")) {
      errors.push(`routes.${routeKey}.route.tr must start with /tr/`);
    }

    for (const field of ["title", "description"]) {
      requiredString(route.metadata?.[field]?.en, `routes.${routeKey}.metadata.${field}.en`, errors);
      requiredString(route.metadata?.[field]?.tr, `routes.${routeKey}.metadata.${field}.tr`, errors);
    }

    const entries = Object.entries(route.content || {});
    if (!entries.length) errors.push(`routes.${routeKey}.content must not be empty`);

    for (const [contentId, entry] of entries) {
      routeContentCount += 1;
      if (!contentId.startsWith(`${config.contentPrefix}.`)) {
        errors.push(`${contentId} must start with ${config.contentPrefix}.`);
      }
      if (seenIds.has(contentId)) errors.push(`duplicate content ID ${contentId}`);
      seenIds.add(contentId);
      requiredString(entry.en, `${contentId}.en`, errors);
      requiredString(entry.tr, `${contentId}.tr`, errors);
      requiredString(entry.locationRole, `${contentId}.locationRole`, errors);
      requiredString(entry.status, `${contentId}.status`, errors);
      if (entry.status !== route.sourcePage?.status) {
        errors.push(`${contentId}.status must match its source page status`);
      }
    }
  }

  if (String(snapshot.shared?.sourcePage?.id) !== String(registry.shared.pageId)) {
    errors.push(`shared.sourcePage.id must be ${registry.shared.pageId}`);
  }

  for (const [contentId, entry] of Object.entries(snapshot.shared?.content || {})) {
    sharedContentCount += 1;
    if (!contentId.startsWith("SHARED.")) errors.push(`${contentId} must start with SHARED.`);
    if (seenIds.has(contentId)) errors.push(`duplicate content ID ${contentId}`);
    seenIds.add(contentId);
    requiredString(entry.en, `${contentId}.en`, errors);
    requiredString(entry.tr, `${contentId}.tr`, errors);
    requiredString(entry.status, `${contentId}.status`, errors);
    if (!ALLOWED_SHARED_STATUSES.has(entry.status)) {
      errors.push(`${contentId}.status is not publishable: ${entry.status}`);
    }
  }

  if (!sharedContentCount) errors.push("shared.content must not be empty");

  if (errors.length) {
    const error = new Error(`Content snapshot validation failed:\n- ${errors.join("\n- ")}`);
    error.validationErrors = errors;
    throw error;
  }

  return {
    routeCount: actualRouteKeys.length,
    routeContentCount,
    sharedContentCount,
    excludedContentCount: snapshot.shared?.excluded?.length || 0,
    totalPublishedContentCount: routeContentCount + sharedContentCount
  };
}
