using Backend.Application.Models;
using Backend.Application.Models.Receivers;

namespace Backend.Application.Interfaces;

public interface IUserRegistrationService
{
    Task<RegistrationResult> RegisterAsync(UserRegistrationDto registrationDto);
}