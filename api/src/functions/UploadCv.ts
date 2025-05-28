import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
// @ts-ignore
import formidable from "formidable";
import { IncomingMessage } from "http";

// Pomocnicza funkcja do parsowania formularza
function parseForm(req: IncomingMessage): Promise<{ fileBuffer: Buffer, filename: string }> {
    return new Promise((resolve, reject) => {
        const form = formidable({ multiples: false });

        form.parse(req, (err, fields, files) => {
            if (err) return reject(err);

            const file: formidable.File | undefined = files.file as formidable.File;
            if (!file || !file.filepath) return reject(new Error("Brak pliku"));

            const fs = require('fs');
            const buffer = fs.readFileSync(file.filepath);
            resolve({ fileBuffer: buffer, filename: file.originalFilename || "uploaded.pdf" });
        });
    });
}

export async function UploadCv(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    if (!request.headers["content-type"]?.includes("multipart/form-data")) {
        return {
            status: 400,
            body: "Niepoprawny nagłówek – oczekiwano multipart/form-data."
        };
    }

    let fileBuffer: Buffer;
    let originalName: string;

    try {
        const result = await parseForm(request as any); // rzutowanie potrzebne do użycia IncomingMessage
        fileBuffer = result.fileBuffer;
        originalName = result.filename;
    } catch (err) {
        context.log("Błąd parsowania formularza:", err);
        return {
            status: 400,
            body: "Błąd przetwarzania pliku."
        };
    }

    // TODO: Skanowanie pliku przy pomocy DLL
    // const isSafe = await scanFileWithDll(fileBuffer);
    // if (!isSafe) {
    //     return {
    //         status: 400,
    //         body: "Plik został uznany za niebezpieczny."
    //     };
    // }

    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.STORAGE_CONNECTION_STRING!);
    const containerClient = blobServiceClient.getContainerClient("safe-cv");

    const blobName = `${Date.now()}_${originalName.replace(/\s+/g, "_")}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(fileBuffer, {
        blobHTTPHeaders: { blobContentType: "application/pdf" },
    });

    return {
        status: 200,
        body: `CV przesłane jako ${blobName}`
    };
}

app.http('UploadCv', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: UploadCv
});
