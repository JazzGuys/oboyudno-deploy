using System.Security.Cryptography;
using System.Text;
using Backend.Application;
using Konscious.Security.Cryptography;

namespace Backend.Infrastructure;

public class Argon2HashingService : IHashingService
{
    private const int DegreeOfParallelism = 4; // поменять под хоста
    private const int MemorySize = 65536; // поменять под хоста
    private const int Iterations = 4;  
    
    public byte[] EncryptPassword(string password, byte[] salt)
    {
        using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password));
        argon2.Salt = salt;
        argon2.DegreeOfParallelism = DegreeOfParallelism;
        argon2.MemorySize = MemorySize;
        argon2.Iterations = Iterations;

        return argon2.GetBytes(32);
    }
}