FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY . .

RUN dotnet restore Backend.Api/Backend.Api.csproj
RUN dotnet publish Backend.Api/Backend.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://0.0.0.0:5021

EXPOSE 5021

ENTRYPOINT ["dotnet", "Backend.Api.dll"]