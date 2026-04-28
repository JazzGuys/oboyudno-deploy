namespace Backend.Application.Interfaces;

public interface IFileStorageService
{
    Task<string> UploadAsync(Stream fileStream, string fileName, string contentType);
}