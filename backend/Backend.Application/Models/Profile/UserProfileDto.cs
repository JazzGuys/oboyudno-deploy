namespace Backend.Application.Models.Profile;

public class UserProfileDto
{
    public Guid Id { get; set; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    
    public string Username { get; init; } = string.Empty;
    
    public string? Email { get; init; }
    
    public double Rating { get; set; }
    
    public string? AvatarFileName { get; set; }
    
    public ICollection<CommentDto>? ReceivedComments { get; set; }

    public ICollection<CommentDto>? WrittenComments { get; set; }
    
    public ICollection<TransactionDto>? PendingTransactions { get; set; }
    
    public ICollection<TransactionDto>? Transactions { get; set; }
    
    public ICollection<TransactionDto>? SentTransactions { get; set; }
}