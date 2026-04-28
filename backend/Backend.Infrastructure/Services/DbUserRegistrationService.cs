using System.Security.Cryptography;
using System.ComponentModel.DataAnnotations;
using Backend.Application;
using Backend.Application.Interfaces;
using Backend.Application.Models;
using Backend.Application.Models.Receivers;
using Backend.Domain.Entities;
using Backend.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Backend.Infrastructure;

public class DbUserRegistrationService(OboyudnoDbContext context, IHashingService hashingService)
    : IUserRegistrationService
{
    public async Task<RegistrationResult> RegisterAsync(UserRegistrationDto registrationDto)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var passwordHash = hashingService.EncryptPassword(registrationDto.Password, salt);

        var user = new User
        {
            PasswordHash = passwordHash,
            PasswordSalt = salt,
            Email = registrationDto.Email,
            FirstName = registrationDto.FirstName,
            LastName = registrationDto.LastName,
            Username = registrationDto.Username
        };

        var possibleErrors = await GetValidationErrors(registrationDto);
        if (possibleErrors.Length > 0)
            return RegistrationResult.Failure(possibleErrors);
        
        context.Users.Add(user);
        await context.SaveChangesAsync();
        return RegistrationResult.Success(user.Id);
    }

    async Task<string[]> GetValidationErrors(UserRegistrationDto registrationDto)
    {
        var errors = new List<string>();
        if (!IsValidEmail(registrationDto.Email))
            errors.Add("Почтовый ящик не существует");

        var existingUser = await context.Users
            .Where(u => u.Email == registrationDto.Email || u.Username == registrationDto.Username)
            .Select(u => new { u.Email, u.Username })
            .FirstOrDefaultAsync();

        if (existingUser != null)
        {
            if (existingUser.Email == registrationDto.Email)
                errors.Add("Этот email уже используется");
            if (existingUser.Username == registrationDto.Username)
                errors.Add("Этот никнейм уже занят");
        }

        return errors.ToArray();
    }

    bool IsValidEmail(string email)
    {
        var checker = new EmailAddressAttribute();
        return checker.IsValid(email);
    }
}
