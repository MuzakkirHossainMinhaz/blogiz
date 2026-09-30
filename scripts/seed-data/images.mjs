/**
 * Seed image helpers. Blog/banner URLs must match isStoredImageUrl for API writes;
 * direct Mongo inserts still use Cloudinary-shaped HTTPS URLs so next/image and public
 * components accept them when CLOUDINARY_CLOUD_NAME matches.
 */

export function seedCloudName() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (cloud && /^[a-z0-9_-]+$/i.test(cloud)) return cloud;
  return "demo";
}

export function seedImageUrl(publicId, version = 1710000000, ext = "jpg") {
  const cloud = seedCloudName();
  return `https://res.cloudinary.com/${cloud}/image/upload/v${version}/${publicId}.${ext}`;
}
