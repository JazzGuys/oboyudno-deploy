using Backend.Domain.Entities;

namespace Backend.Application.Models.Transactions;

public class TransactionCommentDto
{
    public Guid TransactionId { get; set; }

    public Guid ReviewerId { get; set; }

    public string ReviewerUsername { get; set; } = string.Empty;

    public Guid ReceiverId { get; set; }

    public string ReceiverUsername { get; set; } = string.Empty;

    public int Rating { get; set; }

    public string? Text { get; set; }

    public ReviewerRole ReviewerRole { get; set; }

    public DateTime CreatedAt { get; set; }
}
