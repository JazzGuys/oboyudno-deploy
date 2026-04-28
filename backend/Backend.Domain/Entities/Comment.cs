namespace Backend.Domain.Entities;

public class Comment
{
    public Guid TransactionId { get; init; }
    public Transaction Transaction { get; set; } = null!;

    public Guid UserId { get; init; }
    public User User { get; set; } = null!;
    public Guid ReviewerId { get; init; }
    public User Reviewer { get; set; } = null!;

    public int Rating { get; set; }
    public string? Text { get; set; }
    public ReviewerRole ReviewerRole { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum ReviewerRole
{
    Customer,
    Executor
}