using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Persistence.Configurations;

public class CommentsConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> builder)
    {
        builder.HasKey(c => new { c.UserId, c.TransactionId });
        builder.HasIndex(c => new { c.UserId, c.ReviewerRole });

        builder.HasOne(c => c.User).WithMany(u => u.ReceivedComments).HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(c => c.Reviewer).WithMany(u => u.WrittenComments).HasForeignKey(c => c.ReviewerId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(c => c.Transaction).WithMany().HasForeignKey(c => c.TransactionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}