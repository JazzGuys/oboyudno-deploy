using Backend.Application;
using Backend.Application.Interfaces;
using Backend.Application.Models.Receivers;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure.Services;

public class DbUserLoginService(OboyudnoDbContext context, IHashingService hashingService, IJwtProvider jwtProvider)
    : IUserLoginService
{
    public async Task<string?> GetJwtTokenByUsernameAndPassword(UserLoginDto userLoginDto)
    {
        var user = await context.Users.Where(u => u.Username == userLoginDto.Username).FirstOrDefaultAsync();
        if (user is not null &&
            user.PasswordHash.SequenceEqual(hashingService.EncryptPassword(userLoginDto.Password, user.PasswordSalt)))
            return jwtProvider.Generate(user);

        return null;
    }
}