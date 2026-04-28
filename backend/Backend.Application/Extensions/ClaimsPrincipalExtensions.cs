using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace Backend.Application.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid? GetUserId(this ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                          ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (Guid.TryParse(userIdClaim, out var guid))
            return guid;

        return null;
    }

    public static string? GetUsername(this ClaimsPrincipal user) => user.FindFirst(JwtRegisteredClaimNames.Name)?.Value;
}