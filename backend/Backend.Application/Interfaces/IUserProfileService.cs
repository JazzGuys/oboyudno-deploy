using Backend.Application.Models;
using Backend.Application.Models.Profile;

namespace Backend.Application.Interfaces;

public interface IUserProfileService
{
    Task<UserProfileDto?> GetProfileAsync(string username, Guid? currentUserId);
}