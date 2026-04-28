using Backend.Application.Interfaces;
using Backend.Application.Models;
using Backend.Application.Models.Receivers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Api.Controllers;

[ApiController]
[Route("[controller]")]
[AllowAnonymous]
public class AuthController(IUserRegistrationService userRegistrationService, IUserLoginService userLoginService)
    : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] UserRegistrationDto registrationDto)
    {
        var registrationResult = await userRegistrationService.RegisterAsync(registrationDto);
        if (registrationResult.IsSuccess)
            return Ok(registrationResult.UserId);
        return BadRequest(registrationResult.Errors);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] UserLoginDto loginDto)
    {
        var token = await userLoginService.GetJwtTokenByUsernameAndPassword(loginDto);
        if (token is not null)
            return Ok(new { Token = token });
        return Unauthorized("Неверный логин или пароль");
    }
}