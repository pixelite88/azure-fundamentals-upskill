using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;
using S_RiskAssesment;
using Newtonsoft.Json;
using HttpMultipartParser;
using System.Linq;

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

        try
        {
            // Parsowanie multipart/form-data
            var parser = await MultipartFormDataParser.ParseAsync(req.Body);
            var filePart = parser.Files.FirstOrDefault();

            if (filePart == null || filePart.Data == null)
            {
                var badRequest = req.CreateResponse(HttpStatusCode.BadRequest);
                await badRequest.WriteStringAsync("Nie znaleziono pliku w formularzu.");
                return badRequest;
            }

            using var memoryStream = new MemoryStream();
            await filePart.Data.CopyToAsync(memoryStream);
            var buffer = memoryStream.ToArray();

            if (buffer.Length == 0)
            {
                var badRequest = req.CreateResponse(HttpStatusCode.BadRequest);
                await badRequest.WriteStringAsync("Przesłany plik jest pusty.");
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

            ScanResult result;

            // Próba skanowania pliku, jeśli błąd - uznaj plik za niebezpieczny
            try
            {
                result = await ScanPdfAsync(buffer, _logger);
                _logger.LogInformation("Wynik skanowania: IsSafe={Result}", result.IsSafe);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Błąd podczas skanowania PDF, plik oznaczany jako niebezpieczny.");
                result = new ScanResult
                {
                    IsSafe = false,
                    Details = $"Błąd skanowania: {ex.Message}"
                };
            }

            var containerName = result.IsSafe ? "safe-cv" : "unsafe-cv";

            try
            {
                var blobServiceClient = new BlobServiceClient(storageConnectionString);
                var containerClient = blobServiceClient.GetBlobContainerClient(containerName);
                await containerClient.CreateIfNotExistsAsync();

                var blobName = $"{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{filePart.FileName}";
                var blobClient = containerClient.GetBlobClient(blobName);

                using var uploadStream = new MemoryStream(buffer);
                await blobClient.UploadAsync(uploadStream, new BlobHttpHeaders { ContentType = "application/pdf" });

                _logger.LogInformation($"Plik {blobName} został zapisany w kontenerze {containerName}.");

                var response = req.CreateResponse(HttpStatusCode.OK);
                await response.WriteStringAsync(
                    $"CV przesłane jako {blobName}. Status bezpieczeństwa: {(result.IsSafe ? "bezpieczny" : "niebezpieczny")}.");
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Błąd przy zapisie do Azure Blob Storage.");
                var error = req.CreateResponse(HttpStatusCode.InternalServerError);
                await error.WriteStringAsync("Błąd serwera: nie udało się zapisać pliku do Azure Blob Storage.");
                return error;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Nieoczekiwany błąd UploadCv.");
            var error = req.CreateResponse(HttpStatusCode.InternalServerError);
            await error.WriteStringAsync("Nieoczekiwany błąd serwera.");
            return error;
        }
    }

    private static async Task<ScanResult> ScanPdfAsync(byte[] fileBytes, ILogger logger)
    {
        try
        {
            logger.LogInformation("Rozpoczęcie skanowania PDF...");
            var licenseKey = "506333AD-F056-4085-9FDC-06A9D87D3683";
            var riskAnalyzer = RiskAssessment.Create(licenseKey);
            await using var stream = new MemoryStream(fileBytes);
            stream.Position = 0;
            var result = await riskAnalyzer.Scan(stream);

            bool isSafe = false;
            if (result != null)
            {
                var resultType = result.GetType();
                var safeProp = resultType.GetProperty("IsSafe") ?? resultType.GetProperty("Safe") ?? resultType.GetProperty("Success");
                if (safeProp != null)
                {
                    isSafe = (bool)(safeProp.GetValue(result) ?? false);
                }
            }

            return new ScanResult
            {
                IsSafe = isSafe,
                Details = JsonConvert.SerializeObject(result)
            };
        }
        catch (Exception ex)
        {
            logger.LogError("Błąd podczas działania ScanPdfAsync: {Message}\n{StackTrace}\nInner: {Inner}",
                ex.Message,
                ex.StackTrace,
                ex.InnerException?.ToString() ?? "brak");
            throw;
        }
    }

    public class ScanResult
    {
        public bool IsSafe { get; set; }
        public string? Details { get; set; }
    }
}
