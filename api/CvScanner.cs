using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;

namespace api;

public class UploadCv
{
    private readonly ILogger<UploadCv> _logger;

    public UploadCv(ILogger<UploadCv> logger)
    {
        _logger = logger;
    }

    [Function("UploadCv")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequestData req)
    {
        _logger.LogInformation("UploadCv: rozpoczęcie przetwarzania pliku");

        if (!req.Headers.TryGetValues("Content-Type", out var contentTypes) ||
            !string.Join(";", contentTypes).Contains("application/pdf"))
        {
            var badRequest = req.CreateResponse(HttpStatusCode.BadRequest);
            await badRequest.WriteStringAsync("Niepoprawny typ pliku – oczekiwano application/pdf.");
            return badRequest;
        }

        using var memoryStream = new MemoryStream();
        await req.Body.CopyToAsync(memoryStream);
        var buffer = memoryStream.ToArray();

        if (buffer.Length == 0)
        {
            var badRequest = req.CreateResponse(HttpStatusCode.BadRequest);
            await badRequest.WriteStringAsync("Brak danych w przesłanym pliku.");
            return badRequest;
        }

        var storageConnectionString = Environment.GetEnvironmentVariable("STORAGE_CONNECTION_STRING");
        if (string.IsNullOrEmpty(storageConnectionString))
        {
            _logger.LogError("Brak STORAGE_CONNECTION_STRING w zmiennych środowiskowych.");
            var error = req.CreateResponse(HttpStatusCode.InternalServerError);
            await error.WriteStringAsync("Błąd serwera: brak konfiguracji połączenia z magazynem.");
            return error;
        }

        // 👇 Skanowanie PDF
        var result = ScanPdf(buffer);
        _logger.LogInformation("Wynik z .NET: {Result}", result.IsSafe);

        var containerName = result.IsSafe ? "safe-cv" : "unsafe-cv";
        var blobServiceClient = new BlobServiceClient(storageConnectionString);
        var containerClient = blobServiceClient.GetBlobContainerClient(containerName);
        await containerClient.CreateIfNotExistsAsync();

        var blobName = $"{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_uploaded.pdf";
        var blobClient = containerClient.GetBlobClient(blobName);

        using var uploadStream = new MemoryStream(buffer);
        await blobClient.UploadAsync(uploadStream, new BlobHttpHeaders { ContentType = "application/pdf" });

        var exists = await blobClient.ExistsAsync();
        if (exists)
        {
            _logger.LogInformation($"Plik {blobName} został zapisany.");
        }
        else
        {
            _logger.LogError($"Błąd zapisu pliku {blobName}.");
        }

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteStringAsync($"CV przesłane jako {blobName}");
        return response;
    }

    // 👇 Lokalna metoda skanująca (możesz podpiąć DLL)
    private static ScanResult ScanPdf(byte[] fileBytes)
    {
        // TODO: Wstaw logikę prawdziwego skanowania PDF
        return new ScanResult { IsSafe = true }; // lub false
    }

    private class ScanResult
    {
        public bool IsSafe { get; set; }
    }
}
