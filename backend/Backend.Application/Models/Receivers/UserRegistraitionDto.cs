namespace Backend.Application.Models.Receivers;

public record UserRegistrationDto(string FirstName, string LastName, string Username, string Email, string Password);
