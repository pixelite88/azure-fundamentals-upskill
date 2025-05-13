import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import formidable, { File } from "formidable";
import fs from "fs";
import path from "path";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
const CONTAINER_NAME = "cv-uploads";

const httpTrigger: AzureFunction = async function (
    context: Context,
    req: HttpRequest
): Promise<void> {
    try {
        const form = formidable({ multiples: false });

        const parsed = await new Promise<{ files: formidable.Files }>((resolve, reject) => {
            form.parse(req, (err, _fields, files) => {
                if (err) reject(err);
                else resolve({ files });
            });
        });

        const uploadedFile = parsed.files.file as File;

        if (!uploadedFile) {
            context.res = {
                status: 400,
                body: "No file uploaded"
            };
            return;
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

        // Create container if it doesn't exist
        await containerClient.createIfNotExists();

        const blockBlobClient = containerClient.getBlockB
