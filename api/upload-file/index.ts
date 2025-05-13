import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import formidable, { File } from "formidable";
import fs from "fs";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
const CONTAINER_NAME = "cv-uploads";

const handleUpload = async (req: HttpRequest, context: Context) => {
    const form = formidable({ multiples: false });

    return new Promise<{ status: number; body: string }>((resolve, reject) => {
        form.parse(req, async (err, _fields, files) => {
            if (err) {
                context.log.error("Form parse error:", err);
                resolve({ status: 400, body: "Could not parse form data" });
                return;
            }

            const uploadedFile = files.file as File;

            if (!uploadedFile) {
                resolve({ status: 400, body: "No file uploaded" });
                return;
            }

            try {
                const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
                const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
                await containerClient.createIfNotExists();

                const blobName = uploadedFile.originalFilename || "uploaded.pdf";
                const blockBlobClient = containerClient.getBlockBlobClient(blobName);

                const stream = fs.createReadStream(uploadedFile.filepath);
                await blockBlobClient.uploadStream(stream, undefined, undefined, {
                    blobHTTPHeaders: { blobContentType: uploadedFile.mimetype || "application/pdf" }
                });

                resolve({ status: 200, body: `Uploaded ${blobName} successfully` });
            } catch (uploadErr: any) {
                context.log.error("Upload error:", uploadErr.message);
                resolve({ status: 500, body: "Failed to upload file" });
            }
        });
    });
};

const httpTrigger: AzureFunction = async function (
    context: Context,
    req: HttpRequest
): Promise<void> {
    if (req.method !== "POST") {
        context.res = {
            status: 405,
            body: "Method not allowed"
        };
        return;
    }

    const result = await handleUpload(req, context);
    context.res = result;
};

export default httpTrigger;
