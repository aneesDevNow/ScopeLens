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
        const region = process.env.S3_REGION || "us-east-1";
        const accessKeyId = process.env.S3_ACCESS_KEY;
        const secretAccessKey = process.env.S3_SECRET_KEY;

        if (!endpoint || !accessKeyId || !secretAccessKey) {
            throw new Error(
                "Missing S3 config. Set S3_ENDPOINT, S3_ACCESS_KEY, and S3_SECRET_KEY in .env.local"
            );
        }

        _client = new S3Client({
            endpoint,
            region,
            credentials: { accessKeyId, secretAccessKey },
            forcePathStyle: true, // Required for MinIO / R2 / non-AWS S3
        });
    }
    return _client;
}

// ─── Bucket names from env (with defaults) ───
export function getDocumentsBucket(): string {
    return process.env.S3_BUCKET_DOCUMENTS || "documents";
}

export function getReportsBucket(): string {
    return process.env.S3_BUCKET_REPORTS || "reports";
}

// ─── Upload ───
export async function uploadToS3(
    bucket: string,
    key: string,
    body: ArrayBuffer | Buffer | Uint8Array,
    contentType: string,
    upsert = false
): Promise<{ path: string }> {
    const client = getClient();

    await client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body instanceof ArrayBuffer ? Buffer.from(body) : body,
            ContentType: contentType,
        })
    );

    return { path: key };
}

// ─── Download ───
export async function downloadFromS3(
    bucket: string,
    key: string
): Promise<{ data: Buffer | null; error: Error | null }> {
    try {
        const client = getClient();
        const response = await client.send(
            new GetObjectCommand({
                Bucket: bucket,
                Key: key,
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
    bucket: string,
    key: string
): Promise<void> {
    const client = getClient();
    await client.send(
        new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        })
    );
}
