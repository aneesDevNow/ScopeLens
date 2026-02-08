import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// ─── S3 client (lazy singleton) ───
let _client: S3Client | null = null;

function getClient(): S3Client {
    if (!_client) {
        const endpoint = process.env.S3_ENDPOINT;
        const accessKeyId = process.env.S3_ACCESS_KEY;
        const secretAccessKey = process.env.S3_SECRET_KEY;

        if (!endpoint || !accessKeyId || !secretAccessKey) {
            throw new Error(
                "Missing S3 config. Set S3_ENDPOINT, S3_ACCESS_KEY, and S3_SECRET_KEY in .env.local"
            );
        }

        // Extract region from endpoint URL (e.g. s3.eu-central-2.wasabisys.com → eu-central-2)
        let region = "us-east-1";
        try {
            const host = new URL(endpoint).hostname;
            const parts = host.split(".");
            if (parts.length >= 3 && parts[0] === "s3") {
                region = parts[1];
            }
        } catch { /* fallback to us-east-1 */ }

        _client = new S3Client({
            endpoint,
            region,
            credentials: { accessKeyId, secretAccessKey },
            forcePathStyle: true,
        });
    }
    return _client;
}

// ─── Single bucket + folder prefixes ───
function getBucket(): string {
    return process.env.S3_BUCKET_NAME || "scopelens";
}

export function getDocumentsFolder(): string {
    return process.env.S3_BUCKET_FOLDER_DOCUMENTS || "documents";
}

export function getReportsFolder(): string {
    return process.env.S3_BUCKET_FOLDER_REPORTS || "reports";
}

/** Build the full S3 key: folder/key */
function buildKey(folder: string, key: string): string {
    return `${folder}/${key}`;
}

// ─── Upload ───
export async function uploadToS3(
    folder: string,
    key: string,
    body: ArrayBuffer | Buffer | Uint8Array,
    contentType: string
): Promise<{ path: string }> {
    const client = getClient();
    const fullKey = buildKey(folder, key);

    await client.send(
        new PutObjectCommand({
            Bucket: getBucket(),
            Key: fullKey,
            Body: body instanceof ArrayBuffer ? Buffer.from(body) : body,
            ContentType: contentType,
        })
    );

    return { path: key };
}

// ─── Download ───
export async function downloadFromS3(
    folder: string,
    key: string
): Promise<{ data: Buffer | null; error: Error | null }> {
    try {
        const client = getClient();
        const fullKey = buildKey(folder, key);

        const response = await client.send(
            new GetObjectCommand({
                Bucket: getBucket(),
                Key: fullKey,
            })
        );

        if (!response.Body) {
            return { data: null, error: new Error("Empty response body") };
        }

        // Convert readable stream to Buffer
        const chunks: Uint8Array[] = [];
        const stream = response.Body as AsyncIterable<Uint8Array>;
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        return { data: Buffer.concat(chunks), error: null };
    } catch (err) {
        return { data: null, error: err as Error };
    }
}

// ─── Delete ───
export async function deleteFromS3(
    folder: string,
    key: string
): Promise<void> {
    const client = getClient();
    const fullKey = buildKey(folder, key);

    await client.send(
        new DeleteObjectCommand({
            Bucket: getBucket(),
            Key: fullKey,
        })
    );
}
