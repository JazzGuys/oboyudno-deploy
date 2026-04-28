using Backend.Application.Models;
using Backend.Application.Models.Receivers;

namespace Backend.Application.Interfaces;

public interface IUserLoginService
{
    public Task<string?> GetJwtTokenByUsernameAndPassword(UserLoginDto userLoginDto);
}