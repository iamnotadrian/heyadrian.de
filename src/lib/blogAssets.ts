const blogAssets = import.meta.glob(
  "../content/blog/**/*.{jpg,jpeg,png,webp,gif,avif,pdf,zip}",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
) as Record<string, string>;

export const isPublicOrExternalUrl = (path: string) =>
  path.startsWith("/") ||
  path.startsWith("http://") ||
  path.startsWith("https://");

export const resolveBlogAsset = (postId: string, assetPath: string) => {
  if (isPublicOrExternalUrl(assetPath)) {
    return assetPath;
  }

  const normalizedPath = assetPath.replace(/^\.?\//, "");
  const assetKey = `../content/blog/${postId}/${normalizedPath}`;

  return blogAssets[assetKey] ?? assetPath;
};
