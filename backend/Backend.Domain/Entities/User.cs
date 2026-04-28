    namespace Backend.Domain.Entities;

    public class User
    {
        public Guid Id { get; init; } = Guid.CreateVersion7();
        public string FirstName { get; init; } = string.Empty;
        public string LastName { get; init; } = string.Empty;
        
        public string Username { get; init; } = string.Empty;
        
        public string Email { get; init; } = string.Empty;
        public byte[] PasswordHash { get; set; } = [];
        public byte[] PasswordSalt { get; set; } = [];
        
        public double Rating { get; set; }
        
        public string? AvatarFileName { get; set; }
        
        public ICollection<Comment> ReceivedComments { get; set; } = new List<Comment>();

        public ICollection<Comment> WrittenComments { get; set; } = new List<Comment>();
        
        public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
        
        public ICollection<Transaction> PendingTransactions { get; set; } = new List<Transaction>();
        
        public ICollection<Transaction> SentTransactions { get; set; } = new List<Transaction>();
    }
