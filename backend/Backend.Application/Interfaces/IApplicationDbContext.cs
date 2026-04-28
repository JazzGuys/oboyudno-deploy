using Microsoft.EntityFrameworkCore;
using Backend.Domain.Entities;

namespace Backend.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Comment> Comments { get; }
    DbSet<Transaction> Transactions { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}