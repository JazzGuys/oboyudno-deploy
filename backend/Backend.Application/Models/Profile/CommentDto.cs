using Backend.Domain.Entities;

namespace Backend.Application.Models.Profile;

public class CommentDto
{
    public string Username { get; set; } = string.Empty;
    public string? Text { get; set; } = string.Empty;
    public int Rating { get; set; }

    public DateTime CreatedAt { get; set; }

    public ReviewerRole ReviewerRole { get; set; }
}