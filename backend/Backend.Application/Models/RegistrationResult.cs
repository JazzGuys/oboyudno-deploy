namespace Backend.Application.Models;

public record RegistrationResult
{
    public bool IsSuccess { get; init; }
    public IEnumerable<string> Errors { get; init; } = Enumerable.Empty<string>();
    public Guid? UserId { get; init; }

    public static RegistrationResult Success(Guid userId) =>
        new() { IsSuccess = true, UserId = userId };

    public static RegistrationResult Failure(params string[] errors) =>
        new() { IsSuccess = false, Errors = errors };
}