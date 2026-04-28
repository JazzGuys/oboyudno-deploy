using Backend.Application.Extensions;
using Backend.Application.Interfaces;
using Backend.Application.Models.Receivers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Backend.Api.Controllers;

//Тут тоже DRY и обработка ошибок
[ApiController]
[Route("[controller]")]
public class TransactionController(ITransactionService transactionService, IConfiguration configuration) : ControllerBase
{
    [HttpPost("send-invite")]
    public async Task<IActionResult> Create([FromBody] SendTransactionDto dto)
    {
        if (User.GetUserId() is not { } userId)
            return Unauthorized();
        await transactionService.SendInviteAsync(userId, dto);
        return Ok();
    }

    [HttpPost("accept-invite/{id}")]
    public async Task<IActionResult> AcceptInvite(string id)
    {
        if (User.GetUserId() is not { } userId)
            return Unauthorized();
        await transactionService.AcceptInviteAsync(userId, Guid.Parse(id));
        return Ok();
    }

    [HttpPost("decline-invite/{id}")]
    public async Task<IActionResult> DeclineInvite(string id)
    {
        if (User.GetUserId() is not { } userId)
            return Unauthorized();
        await transactionService.CancelInviteAsync(userId, Guid.Parse(id));
        return Ok();
    }

    [HttpPost("change-and-send-invite/{id}")]
    public async Task<IActionResult> ChangeAndSendInvite(string id, [FromBody] SendTransactionDto dto)
    {
        if (User.GetUserId() is not { } userId)
            return Unauthorized();
        await transactionService.ChangeAndSendInviteAsync(userId, dto, Guid.Parse(id));
        return Ok();
    }

    [HttpPost("send-end-request/{id}")]
    public async Task<IActionResult> SendEndRequest(string id)
    {
        if (User.GetUserId() is not { } userId)
            return Unauthorized();

        try
        {
            await transactionService.SendEndRequestAsync(userId, Guid.Parse(id));
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }

        return Ok();
    }
    
    [HttpPost("accept-end-request/{id}")]
    public async Task<IActionResult> AcceptEndRequest(string id)
    {
        if (User.GetUserId() is not { } userId)
            return Unauthorized();

        try
        {
            await transactionService.AcceptEndRequestAsync(userId, Guid.Parse(id));
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }

        return Ok();
    }
    
    [HttpPost("cancel-end-request/{id}")]
    public async Task<IActionResult> CancelEndRequest(string id)
    {
        if (User.GetUserId() is not { } userId)
            return Unauthorized();

        try
        {
            await transactionService.CancelEndRequestAsync(userId, Guid.Parse(id));
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }

        return Ok();
    }

    [HttpPost("leave-comment/{id}")]
    public async Task<IActionResult> LeaveComment(string id, [FromBody] LeaveCommentDto commentDto)
    {
        if (User.GetUserId() is not { } userId)
            return Unauthorized();

        try
        {
            await transactionService.LeaveCommentAsync(userId, Guid.Parse(id), commentDto);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }

        return Ok();
    }

    [HttpGet("comments/{id}")]
    public async Task<IActionResult> GetComments(string id)
    {
        if (User.GetUserId() is not { } userId)
            return Unauthorized();

        try
        {
            var comments = await transactionService.GetCommentsAsync(userId, Guid.Parse(id));
            return Ok(comments);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("upload-video/{id}")]
    public async Task<IActionResult> UploadVideo(string id, IFormFile? file)
    {
        if (file is null || file.Length == 0)
            return BadRequest("Файл не выбран");

        if (User.GetUserId() is not { } userId)
            return Unauthorized();

        var allowedTypes = new[] { "video/mp4", "video/avi", "video/mov" };
        if (!allowedTypes.Contains(file.ContentType))
            return BadRequest("Разрешены только видео файлы");

        (string, byte[]) data;
        await using var stream = file.OpenReadStream();
        try
        {
            data = await transactionService.UploadVideoAsync(userId, Guid.Parse(id), stream,
                file.FileName, file.ContentType);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
        return Ok(new { videoUrl = ResolveVideoUrl(data.Item1), hash = data.Item2 });
    }

    [HttpGet("get-video/{id}")]
    public async Task<IActionResult> GetVideo(string id)
    {
        if (User.GetUserId() is not { } userId)
            return Unauthorized();
        
        (string, byte[]) data;
        try
        {
            data = await transactionService.ReturnVideoAsync(userId, Guid.Parse(id));
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
        
        return Ok(new { videoUrl = ResolveVideoUrl(data.Item1), hash = data.Item2 });
    }

    private string ResolveVideoUrl(string rawUrl)
    {
        if (string.IsNullOrWhiteSpace(rawUrl))
            return rawUrl;

        var serviceUrl = configuration["S3:ServiceUrl"]?.TrimEnd('/');
        var publicUrl = configuration["S3:PublicUrl"]?.TrimEnd('/');

        if (string.IsNullOrWhiteSpace(serviceUrl) || string.IsNullOrWhiteSpace(publicUrl))
            return rawUrl;

        if (string.Equals(serviceUrl, publicUrl, StringComparison.OrdinalIgnoreCase))
            return rawUrl;

        var servicePrefix = $"{serviceUrl}/";
        if (rawUrl.StartsWith(servicePrefix, StringComparison.OrdinalIgnoreCase))
        {
            var remainder = rawUrl.Substring(servicePrefix.Length);
            return $"{publicUrl}/{remainder}";
        }

        return rawUrl;
    }
}
