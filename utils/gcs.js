const { Storage } = require("@google-cloud/storage");

/**
 * Initialize GCS explicitly (REQUIRED for Render)
 */
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
});

const bucketName = process.env.GCS_BUCKET_NAME;
if (!bucketName) {
  throw new Error("GCS_BUCKET_NAME is not set");
}

const bucket = storage.bucket(bucketName);

/**
 * Upload image to GCS
 * @param {Object} file - multer file
 * @returns {Promise<string|null>} object path (NOT URL)
 */
async function uploadFile(file) {
  if (!file) return null;

  const safeName = file.originalname.replace(/\s+/g, "_");
  const objectPath = `products/${Date.now()}-${safeName}`;

  const gcsFile = bucket.file(objectPath);

  const stream = gcsFile.createWriteStream({
    resumable: false,
    contentType: file.mimetype,
  });

  return new Promise((resolve, reject) => {
    stream.on("error", (err) => {
      console.error("❌ GCS upload failed:", err);
      reject(err);
    });

    stream.on("finish", () => {
      resolve(objectPath); // ✅ store this in MongoDB
    });

    stream.end(file.buffer);
  });
}

/**
 * Generate signed URL for private image
 * @param {string} objectPath - GCS object path
 * @returns {Promise<string|null>} signed URL
 */
async function getSignedUrl(objectPath) {
  if (!objectPath) return null;

  // already a URL → return as-is (migration safety)
  if (objectPath.startsWith("http")) return objectPath;

  try {
    const [url] = await bucket.file(objectPath).getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 1 * 60 * 1000, // 1 minute
    });

    return url;
  } catch (err) {
    console.error(`❌ Failed to sign ${objectPath}:`, err.message);
    return null; // ❗ NEVER return filename
  }
}

module.exports = {
  uploadFile,
  getSignedUrl,
};
