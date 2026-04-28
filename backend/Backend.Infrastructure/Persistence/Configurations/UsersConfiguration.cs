using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backend.Infrastructure.Persistence.Configurations;

public class UsersConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.FirstName).HasMaxLength(50).IsRequired();
        builder.Property(x => x.LastName).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(255).IsRequired();
        builder.Property(x => x.Username).HasMaxLength(50).IsRequired();

        builder.HasIndex(x => x.Email).IsUnique();
        builder.HasIndex(x => x.Username).IsUnique();

        builder.Property(x => x.PasswordHash).IsRequired().HasColumnType("bytea");
        builder.Property(x => x.PasswordSalt).IsRequired().HasColumnType("bytea");

        builder.Property(x => x.Rating).IsRequired().HasDefaultValue(5);

        builder.Property(x => x.AvatarFileName).HasMaxLength(255);

        builder.HasMany(u => u.Transactions)
            .WithMany()
            .UsingEntity(j => j.ToTable("UserAllTransactions"));

        builder.HasMany(u => u.PendingTransactions)
            .WithMany()
            .UsingEntity(j => j.ToTable("UserPendingTransactions"));

        builder.HasMany(u => u.SentTransactions)
            .WithMany()
            .UsingEntity(j => j.ToTable("UserSentTransactions"));
    }
}