using Backend.Application.Interfaces;
using Backend.Application.Models;
using Backend.Application.Models.Profile;
using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Application.Services;

public class UserProfileService(IApplicationDbContext context) : IUserProfileService
{
    public async Task<UserProfileDto?> GetProfileAsync(string username, Guid? currentUserId) => await context.Users
        .Where(u => u.Username == username)
        .Select(u => new UserProfileDto
        {
            Id = u.Id,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Username = u.Username,
            Email = IsCurrentUsersProfile(currentUserId, u) ? u.Email : null,
            Rating = u.ReceivedComments.Any() ? Math.Round(u.ReceivedComments.Average(c => c.Rating), 1) : 0,
            AvatarFileName = u.AvatarFileName,
            WrittenComments = IsCurrentUsersProfile(currentUserId, u)
                ? u.WrittenComments.Select(c => new CommentDto
                {
                    Username = c.User.Username,
                    Text = c.Text,
                    Rating = c.Rating,
                    CreatedAt = c.CreatedAt,
                    ReviewerRole = c.ReviewerRole
                }).ToList()
                : null,
            ReceivedComments = u.ReceivedComments.Select(c => new CommentDto
            {
                Username = c.Reviewer.Username,
                Text = c.Text,
                Rating = c.Rating,
                CreatedAt = c.CreatedAt,
                ReviewerRole = c.ReviewerRole
            }).ToList(),
            PendingTransactions = IsCurrentUsersProfile(currentUserId, u)
                ? GetTransactionDto(u.PendingTransactions)
                : null,
            Transactions = IsCurrentUsersProfile(currentUserId, u)
                ? GetTransactionDto(u.Transactions)
                : null,
            SentTransactions = IsCurrentUsersProfile(currentUserId, u)
                ? GetTransactionDto(u.SentTransactions)
                : null,
        })
        .FirstOrDefaultAsync();

    private static bool IsCurrentUsersProfile(Guid? currentUserId, User u)
    {
        return currentUserId != null && u.Id == currentUserId;
    }

    private static List<TransactionDto>? GetTransactionDto(ICollection<Transaction>? transactions)
    {
        return transactions?.Select(t => new TransactionDto(
            t.Id,
            t.CustomerId,
            t.ExecutorId,
            t.FinisherId,
            t.Title,
            t.Description,
            t.VideoLink,
            t.FinishedAt,
            t.CreatedAt,
            t.ExpiresAt,
            t.Status.ToString()
        )).ToList();
    }
}
