using Backend.Application.Extensions;
using Backend.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class ProfileController(IUserProfileService profileService) : ControllerBase
{
    [HttpGet]
    [Route("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = User.GetUserId();
        var username = User.GetUsername();
        if (userId is null || username is null) return Unauthorized();
        var profile = await profileService.GetProfileAsync(username, userId);
        if (profile is null) return NotFound();
        return Ok(profile);
    }

    [HttpGet]
    [Route("{username}")]
    public async Task<IActionResult> GetUsernameProfile(string username)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var profile = await profileService.GetProfileAsync(username, userId);
        if  (profile is null) return NotFound();
        return Ok(profile);
    }
}