using Backend.Application.Interfaces;
using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Persistence;

public class OboyudnoDbContext(DbContextOptions<OboyudnoDbContext> options) : DbContext(options), IApplicationDbContext
{
    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<Transaction> Transactions { get; set; }
    
    public virtual DbSet<Comment> Comments { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(OboyudnoDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}