# Test API Script for AI SaaS Platform
# This script creates a test user and then tests the families API

Write-Host "🚀 Testing AI SaaS Platform API..." -ForegroundColor Green

# Create a test user first
Write-Host "📝 Creating test user..." -ForegroundColor Yellow
$createUserResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{
    "firstName": "Test",
    "lastName": "Admin",
    "email": "test@example.com",
    "role": "super_admin"
}'

$userId = $createUserResponse.user.id
Write-Host "✅ Test user created with ID: $userId" -ForegroundColor Green

# Test 1: Get families (should be empty initially)
Write-Host "`n🏠 Testing GET /api/families..." -ForegroundColor Yellow
try {
    $familiesResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/families" -Method GET -Headers @{"user-id"=$userId}
    Write-Host "✅ Families retrieved successfully" -ForegroundColor Green
    Write-Host "   Total families: $($familiesResponse.totalCount)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error getting families: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Create a family
Write-Host "`n🏠 Testing POST /api/families..." -ForegroundColor Yellow
try {
    $createFamilyResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/families" -Method POST -Headers @{"Content-Type"="application/json"; "user-id"=$userId} -Body '{
        "name": "Goldberger Family",
        "address": "123 Main St",
        "phone": "+1234567890",
        "email": "family@example.com",
        "userId": "' + $userId + '"
    }'
    Write-Host "✅ Family created successfully" -ForegroundColor Green
    Write-Host "   Family ID: $($createFamilyResponse.family.id)" -ForegroundColor Cyan
    $familyId = $createFamilyResponse.family.id
} catch {
    Write-Host "❌ Error creating family: $($_.Exception.Message)" -ForegroundColor Red
    $familyId = "test-family-id"
}

# Test 3: Get families again (should now have one family)
Write-Host "`n🏠 Testing GET /api/families (after creation)..." -ForegroundColor Yellow
try {
    $familiesResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/families" -Method GET -Headers @{"user-id"=$userId}
    Write-Host "✅ Families retrieved successfully" -ForegroundColor Green
    Write-Host "   Total families: $($familiesResponse.totalCount)" -ForegroundColor Cyan
    if ($familiesResponse.families.Count -gt 0) {
        Write-Host "   First family: $($familiesResponse.families[0].name)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Error getting families: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Get family members
Write-Host "`n👥 Testing GET /api/families/$familyId/members..." -ForegroundColor Yellow
try {
    $membersResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/families/$familyId/members" -Method GET -Headers @{"user-id"=$userId}
    Write-Host "✅ Family members retrieved successfully" -ForegroundColor Green
    Write-Host "   Total members: $($membersResponse.totalCount)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error getting family members: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 API testing completed!" -ForegroundColor Green
Write-Host "Test user ID: $userId" -ForegroundColor Cyan
Write-Host "Use this user ID for future API calls" -ForegroundColor Cyan
