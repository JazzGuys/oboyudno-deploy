namespace Backend.Application.Models.Receivers;

public record LeaveCommentDto(
    string? Text,
    int Rating
);