namespace Backend.Application;

public interface IHashingService
{
    byte[] EncryptPassword(string password, byte[] salt);
}