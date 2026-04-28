using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Persistence.Configurations;

public class TransactionsConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.Customer).WithMany().HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Executor).WithMany().HasForeignKey(x => x.ExecutorId).OnDelete(DeleteBehavior.Restrict);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.Title).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Description).IsRequired().HasMaxLength(500);
        builder.Property(x => x.Status).IsRequired();
    }
}