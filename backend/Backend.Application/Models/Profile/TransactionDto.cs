namespace Backend.Application.Models.Profile;

public record TransactionDto(
    Guid Id,
    Guid CustomerId,
    Guid ExecutorId,
    Guid? FinisherId,
    string Title,
    string Description,
    string? VideoLink,
    DateTime? FinishedAt,
    DateTime CreatedAt,
    DateTime? ExpiresAt,
    string Status
);
