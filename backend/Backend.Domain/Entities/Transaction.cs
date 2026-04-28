namespace Backend.Domain.Entities;

public class Transaction
{
    public Guid Id { get; init; }
    
    public Guid CustomerId { get; init; }
    public User Customer { get; set; } = null!;
    public Guid ExecutorId { get; init; }
    public User Executor { get; set; } = null!;
    
    public Guid InitiatorId { get; set; }
    
    public Guid? FinisherId { get; set; }
    
    public DateTime CreatedAt { get; init; } =  DateTime.UtcNow;
    public DateTime? FinishedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    public string? VideoLink { get; set; }
    
    public byte[]? VideoHash { get; set; }

    public TransactionStatus Status { get; set; } = TransactionStatus.New;
}

public enum TransactionStatus
{
    New,
    Cancelled,
    Changed,
    InProgress,
    Finished,
    Expired
}