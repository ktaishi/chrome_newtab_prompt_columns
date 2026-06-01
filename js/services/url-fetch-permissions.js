/* Optional broad host permissions for public URL fetch (AI / URL clip) */
const URL_FETCH_OPTIONAL_ORIGINS = ["http://*/*", "https://*/*"];

async function ensureUrlFetchHostPermissions() {
  const permissionsApi = globalThis.chrome?.permissions;
  if (!permissionsApi?.contains || !permissionsApi?.request) {
    return { ok: true };
  }

  try {
    const hasPermission = await permissionsApi.contains({ origins: URL_FETCH_OPTIONAL_ORIGINS });
    if (hasPermission) return { ok: true };

    const granted = await permissionsApi.request({ origins: URL_FETCH_OPTIONAL_ORIGINS });
    return { ok: Boolean(granted) };
  } catch (error) {
    console.error("ensureUrlFetchHostPermissions failed:", error);
    return { ok: false };
  }
}

function urlFetchPermissionDeniedMessage() {
  return typeof t === "function"
    ? t("fetch.permissionDenied")
    : "公開ページ取得の権限が許可されていません。";
}
