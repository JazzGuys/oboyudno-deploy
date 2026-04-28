using Backend.Domain.Entities;

namespace Backend.Application;

public interface IJwtProvider
{
    string Generate(User user);
}