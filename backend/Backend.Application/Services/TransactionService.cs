using System.Security.Cryptography;
using Backend.Application.Interfaces;
using Backend.Application.Models.Receivers;
using Backend.Application.Models.Transactions;
using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Application.Services;

//TODO: рефактор этого пиздеца +  миграции в конце

//Здесь DRY и исключения
public class TransactionService(IApplicationDbContext db, IFileStorageService fileStorageService) : ITransactionService
{
    public async Task SendInviteAsync(Guid userId, SendTransactionDto dto)
    {
        if (dto.CustomerId == dto.ExecutorId)
            throw new Exception("Нельзя создать сделку с самим собой");

        if (dto.CustomerId != userId && dto.ExecutorId != userId)
            throw new Exception("Вы не можете создать сделку, в которой не участвуете.");

        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            CustomerId = dto.CustomerId,
            ExecutorId = dto.ExecutorId,
            InitiatorId = userId,
            Title = dto.Title,
            Description = dto.Description,
            ExpiresAt = dto.ExpiresAt,
            Status = TransactionStatus.New
        };

        var sender = await db.Users
            .Include(u => u.SentTransactions)
            .Include(u => u.Transactions)
            .FirstOrDefaultAsync(u => u.Id == userId);

        var recieverId = transaction.CustomerId == userId ? transaction.ExecutorId : transaction.CustomerId;
        var reciever = await db.Users
            .Include(u => u.PendingTransactions)
            .Include(u => u.Transactions)
            .FirstOrDefaultAsync(u => u.Id == recieverId);

        if (sender == null || reciever == null)
            throw new Exception("Отправитель или получатель не найден");
        reciever.PendingTransactions.Add(transaction);
        sender.SentTransactions.Add(transaction);
        db.Transactions.Add(transaction);
        await db.SaveChangesAsync();
    }

    public async Task AcceptInviteAsync(Guid userId, Guid transactionId)
    {
        var transaction = await GetTransactionWithAccessCheckAsync(transactionId, userId);

        if (transaction.InitiatorId == userId)
            throw new Exception("Вы не можете принять собственное предложение");

        var user = await db.Users
            .Include(u => u.PendingTransactions)
            .Include(u => u.Transactions)
            .FirstOrDefaultAsync(u => u.Id == userId);

        var initiator = await db.Users
            .Include(u => u.SentTransactions)
            .Include(u => u.Transactions)
            .FirstOrDefaultAsync(u => u.Id == transaction.InitiatorId);

        if (user == null || initiator == null) return;

        user.PendingTransactions.Remove(transaction);
        initiator.SentTransactions.Remove(transaction);

        transaction.Status = TransactionStatus.InProgress;

        user.Transactions.Add(transaction);
        initiator.Transactions.Add(transaction);

        await db.SaveChangesAsync();
    }


    public async Task CancelInviteAsync(Guid userId, Guid transactionId)
    {
        var transaction = await GetTransactionWithAccessCheckAsync(transactionId, userId);

        var user = await db.Users
            .Include(u => u.PendingTransactions)
            .Include(u => u.Transactions)
            .FirstOrDefaultAsync(u => u.Id == userId);

        var initiator = await db.Users
            .Include(u => u.SentTransactions)
            .Include(u => u.Transactions)
            .FirstOrDefaultAsync(u => u.Id == transaction.InitiatorId);

        if (user == null || initiator == null) return;

        user.PendingTransactions.Remove(transaction);
        initiator.SentTransactions.Remove(transaction);

        transaction.Status = TransactionStatus.Cancelled;

        await db.SaveChangesAsync();
    }

    public async Task ChangeAndSendInviteAsync(Guid userId, SendTransactionDto dto, Guid transactionId)
    {
        var transaction = await GetTransactionWithAccessCheckAsync(transactionId, userId);

        var user = await db.Users
            .Include(u => u.PendingTransactions)
            .Include(u => u.Transactions)
            .FirstOrDefaultAsync(u => u.Id == userId);

        var initiator = await db.Users
            .Include(u => u.SentTransactions)
            .Include(u => u.Transactions)
            .FirstOrDefaultAsync(u => u.Id == transaction.InitiatorId);

        if (user == null || initiator == null) return;

        user.PendingTransactions.Remove(transaction);
        initiator.SentTransactions.Remove(transaction);

        transaction.Title = dto.Title;
        transaction.Description = dto.Description;
        transaction.ExpiresAt = dto.ExpiresAt;
        transaction.InitiatorId = userId;
        transaction.Status = TransactionStatus.Changed;

        initiator.PendingTransactions.Add(transaction);
        user.SentTransactions.Add(transaction);

        await db.SaveChangesAsync();
    }

    public async Task SendEndRequestAsync(Guid userId, Guid transactionId)
    {
        var transaction = await GetTransactionWithAccessCheckAsync(transactionId, userId);

        if (transaction.ExecutorId != userId)
            throw new Exception("Только исполнитель может запросить завершение сделки");

        if (transaction.Status != TransactionStatus.InProgress || transaction.FinishedAt is not null)
            throw new Exception("Запросить завершение можно только для активной сделки");

        if (transaction.FinisherId is not null)
            throw new Exception("Запрос на завершение уже отправлен");

        transaction.FinisherId = userId;

        await db.SaveChangesAsync();
    }

    public async Task AcceptEndRequestAsync(Guid userId, Guid transactionId)
    {
        var transaction = await GetTransactionWithAccessCheckAsync(transactionId, userId);

        if (transaction.CustomerId != userId)
            throw new Exception("Только заказчик может подтвердить завершение");

        if (transaction.Status != TransactionStatus.InProgress || transaction.FinishedAt is not null)
            throw new Exception("Сделка уже завершена или не активна");

        if (transaction.FinisherId != transaction.ExecutorId)
            throw new Exception("Исполнитель еще не запрашивал завершение");

        transaction.Status = TransactionStatus.Finished;
        transaction.FinishedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
    }

    public async Task CancelEndRequestAsync(Guid userId, Guid transactionId)
    {
        var transaction = await GetTransactionWithAccessCheckAsync(transactionId, userId);

        if (transaction.CustomerId != userId)
            throw new Exception("Только заказчик может отклонить запрос на завершение");

        if (transaction.Status != TransactionStatus.InProgress || transaction.FinishedAt is not null)
            throw new Exception("Сделка уже завершена или не активна");

        if (transaction.FinisherId != transaction.ExecutorId)
            throw new Exception("Нет активного запроса от исполнителя");

        transaction.FinisherId = null;

        await db.SaveChangesAsync();
    }

    public async Task LeaveCommentAsync(Guid userId, Guid transactionId, LeaveCommentDto dto)
    {
        var transaction = await GetTransactionWithAccessCheckAsync(transactionId, userId);

        if (transaction.Status != TransactionStatus.Finished)
            throw new Exception("Комментарий можно оставить только по завершенной сделке");

        if (dto.Rating < 1 || dto.Rating > 5)
            throw new Exception("Оценка должна быть от 1 до 5");

        var commentReceiverId = transaction.CustomerId == userId ? transaction.ExecutorId : transaction.CustomerId;
        var reviewerRole = transaction.CustomerId == userId ? ReviewerRole.Customer : ReviewerRole.Executor;
        var existingComment = await db.Comments
            .FirstOrDefaultAsync(c => c.TransactionId == transactionId && c.UserId == commentReceiverId);
        Comment? newComment = null;

        if (existingComment is not null)
        {
            if (existingComment.ReviewerId != userId)
                throw new Exception("Комментарий уже оставлен другим участником");

            existingComment.Text = dto.Text;
            existingComment.Rating = dto.Rating;
            existingComment.ReviewerRole = reviewerRole;
        }
        else
        {
            newComment = new Comment
            {
                TransactionId = transactionId,
                Text = dto.Text,
                Rating = dto.Rating,
                UserId = commentReceiverId,
                ReviewerId = userId,
                ReviewerRole = reviewerRole
            };

            db.Comments.Add(newComment);
        }

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException) when (newComment is not null)
        {
            // Concurrent requests can both try to insert the same comment key.
            if (newComment is not null && db is DbContext efDbContext)
                efDbContext.Entry(newComment).State = EntityState.Detached;

            var persistedComment = await db.Comments
                .FirstOrDefaultAsync(c => c.TransactionId == transactionId && c.UserId == commentReceiverId);

            if (persistedComment is null)
                throw;

            if (persistedComment.ReviewerId != userId)
                throw new Exception("Комментарий уже оставлен другим участником");

            persistedComment.Text = dto.Text;
            persistedComment.Rating = dto.Rating;
            persistedComment.ReviewerRole = reviewerRole;
            await db.SaveChangesAsync();
        }
    }

    public async Task<IReadOnlyCollection<TransactionCommentDto>> GetCommentsAsync(Guid userId, Guid transactionId)
    {
        _ = await GetTransactionWithAccessCheckAsync(transactionId, userId);

        return await db.Comments
            .Where(c => c.TransactionId == transactionId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new TransactionCommentDto
            {
                TransactionId = c.TransactionId,
                ReviewerId = c.ReviewerId,
                ReviewerUsername = c.Reviewer.Username,
                ReceiverId = c.UserId,
                ReceiverUsername = c.User.Username,
                Rating = c.Rating,
                Text = c.Text,
                ReviewerRole = c.ReviewerRole,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();
    }

    //Для этих двух обработку исключений нормальную сделать
    public async Task<(string, byte[])> UploadVideoAsync(Guid userId, Guid transactionId, Stream stream,
        string fileName, string contentType)
    {
        var transaction = await GetTransactionWithAccessCheckAsync(transactionId, userId);

        if (transaction.ExecutorId != userId) throw new Exception("Вы не являетесь исполнителем сделки");
        if (transaction.Status != TransactionStatus.InProgress) throw new Exception("Сделка должна быть активна");
        var videoUrl = await fileStorageService.UploadAsync(stream, fileName, contentType);
        stream.Position = 0; var hash = await SHA256.HashDataAsync(stream);
        transaction.VideoLink = videoUrl;
        transaction.VideoHash = hash;
        await db.SaveChangesAsync();
        return (videoUrl, hash);
    }

    public async Task<(string, byte[])> ReturnVideoAsync(Guid userId, Guid transactionId)
    {
        var transaction = await GetTransactionWithAccessCheckAsync(transactionId, userId);

        if (transaction.ExecutorId != userId && transaction.CustomerId != userId)
            throw new Exception("Вы не являетесь участником сделки");

        if (transaction.VideoHash == null || transaction.VideoLink == null)
            throw new Exception("Видео нет");

        return (transaction.VideoLink, transaction.VideoHash);
    }

    //Здесь тоже обработка исключений
    private async Task<Transaction> GetTransactionWithAccessCheckAsync(Guid transactionId, Guid userId)
    {
        var transaction = await db.Transactions.FindAsync(transactionId);

        if (transaction == null)
            throw new Exception("Транзакция не найдена");

        if (transaction.CustomerId != userId && transaction.ExecutorId != userId)
            throw new Exception("Доступ запрещен: вы не являетесь участником этой сделки");

        return transaction;
    }
}
