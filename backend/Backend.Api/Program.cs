using System.Text;
using Backend.Application;
using Backend.Application.Interfaces;
using Backend.Application.Services;
using Backend.Infrastructure;
using Backend.Infrastructure.Auth;
using Backend.Infrastructure.Persistence;
using Backend.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

var configuration = builder.Configuration;

builder.Services.AddControllers(options =>
{
    var policy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
        
    options.Filters.Add(new AuthorizeFilter(policy));
});
var connectionString = configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<OboyudnoDbContext>(options => options.UseNpgsql(connectionString));


// Тут инициализировать все сервисы
builder.Services.AddSingleton<IHashingService, Argon2HashingService>();
builder.Services.AddScoped<IUserRegistrationService, DbUserRegistrationService>();
builder.Services.AddScoped<IUserLoginService, DbUserLoginService>();
builder.Services.AddScoped<IJwtProvider, JwtProvider>();
builder.Services.AddScoped<IApplicationDbContext, OboyudnoDbContext>();
builder.Services.AddScoped<IUserProfileService, UserProfileService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddScoped<IFileStorageService, S3FileStorageService>();
//

builder.Services.Configure<JwtOptions>(configuration.GetSection("Jwt"));

builder.Services.AddRouting(options => options.LowercaseUrls = true);

builder.Services.AddDbContext<OboyudnoDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "JWT Authorization header using the Bearer scheme."
    });
    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("bearer", document)] = []
    });
});

var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (allowedOrigins.Length == 0)
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        else
            policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtKey = configuration["Jwt:Key"] ?? "default-jwt-key-that-is-very-long";
        var jwtIssuer = configuration["Jwt:Issuer"] ?? "issuer";
        var jwtAudience = configuration["Jwt:Audience"] ?? "audience";

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.UseHttpsRedirection();

app.MapControllers();

app.Run();