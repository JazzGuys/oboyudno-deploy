using Backend.Application.Models.Receivers;
using Backend.Application.Models.Transactions;

namespace Backend.Application.Interfaces;

public interface ITransactionService
{
    Task SendInviteAsync(Guid userId, SendTransactionDto dto);

    Task AcceptInviteAsync(Guid userId, Guid transactionId);

    Task CancelInviteAsync(Guid userId, Guid transactionId);

    Task ChangeAndSendInviteAsync(Guid userId, SendTransactionDto dto, Guid transactionId);
    
    Task SendEndRequestAsync(Guid userId, Guid transactionId);
    
    Task AcceptEndRequestAsync(Guid userId, Guid transactionId);
    
    Task CancelEndRequestAsync(Guid userId, Guid transactionId);
    
    Task LeaveCommentAsync(Guid userId, Guid transactionId, LeaveCommentDto dto);

    Task<IReadOnlyCollection<TransactionCommentDto>> GetCommentsAsync(Guid userId, Guid transactionId);

    Task<(string, byte[])> UploadVideoAsync(Guid userId, Guid transactionId, Stream stream, string fileName,
        string contentType);

    Task<(string, byte[])> ReturnVideoAsync(Guid userId, Guid transactionId);
}
