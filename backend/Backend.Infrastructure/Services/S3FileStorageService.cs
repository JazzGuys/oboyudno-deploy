using System.Text.Json;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using Amazon.S3.Util;
using Backend.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace Backend.Infrastructure;

public class S3FileStorageService(IConfiguration configuration) : IFileStorageService
{
    public async Task<string> UploadAsync(Stream fileStream, string fileName, string contentType)
    {
        if (fileStream is null)
            throw new ArgumentNullException(nameof(fileStream));

        if (string.IsNullOrWhiteSpace(fileName))
            fileName = "file";

        if (string.IsNullOrWhiteSpace(contentType))
            contentType = "application/octet-stream";

        var serviceUrl = GetRequiredSetting("S3:ServiceUrl");
        var publicUrl = (configuration["S3:PublicUrl"] ?? serviceUrl).TrimEnd('/');
        var accessKey = GetRequiredSetting("S3:AccessKey");
        var secretKey = GetRequiredSetting("S3:SecretKey");
        var bucketName = GetRequiredSetting("S3:BucketName");

        var s3Config = new AmazonS3Config
        {
            ServiceURL = serviceUrl,
            ForcePathStyle = true
        };

        using var client = new AmazonS3Client(accessKey, secretKey, s3Config);
        await EnsureBucketExistsAsync(client, bucketName);
        await EnsureBucketIsPublicReadAsync(client, bucketName);

        if (fileStream.CanSeek)
            fileStream.Position = 0;

        var key = $"{Guid.NewGuid()}_{fileName}";

        using var transferUtility = new TransferUtility(client);
        var request = new TransferUtilityUploadRequest
        {
            InputStream = fileStream,
            Key = key,
            BucketName = bucketName,
            ContentType = contentType,
            AutoCloseStream = false
        };

        await transferUtility.UploadAsync(request);

        return $"{publicUrl}/{bucketName}/{Uri.EscapeDataString(key)}";
    }

    private string GetRequiredSetting(string key)
    {
        var value = configuration[key];
        if (string.IsNullOrWhiteSpace(value))
            throw new InvalidOperationException($"Configuration value '{key}' is missing.");

        return value;
    }

    private static async Task EnsureBucketExistsAsync(IAmazonS3 client, string bucketName)
    {
        if (await AmazonS3Util.DoesS3BucketExistV2Async(client, bucketName))
            return;

        try
        {
            await client.PutBucketAsync(new PutBucketRequest { BucketName = bucketName });
        }
        catch (AmazonS3Exception ex) when (
            ex.ErrorCode is "BucketAlreadyOwnedByYou" or "BucketAlreadyExists")
        {
            // Bucket created in parallel by another request.
        }
    }

    private static async Task EnsureBucketIsPublicReadAsync(IAmazonS3 client, string bucketName)
    {
        var policyDocument = new
        {
            Version = "2012-10-17",
            Statement = new[]
            {
                new
                {
                    Sid = "PublicReadGetObject",
                    Effect = "Allow",
                    Principal = "*",
                    Action = new[] { "s3:GetObject" },
                    Resource = new[] { $"arn:aws:s3:::{bucketName}/*" }
                }
            }
        };

        var policy = JsonSerializer.Serialize(policyDocument);

        try
        {
            await client.PutBucketPolicyAsync(new PutBucketPolicyRequest
            {
                BucketName = bucketName,
                Policy = policy
            });
        }
        catch (AmazonS3Exception ex) when (ex.ErrorCode is "AccessDenied" or "MethodNotAllowed")
        {
            // Policy can be managed outside of the app in some environments.
        }
    }
}
