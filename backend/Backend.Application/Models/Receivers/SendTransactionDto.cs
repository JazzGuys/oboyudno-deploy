namespace Backend.Application.Models.Receivers;

public record SendTransactionDto(
    Guid CustomerId,
    Guid ExecutorId,
    string Title,
    string Description,
    DateTime? ExpiresAt
);