# Test Single Family Workflow
# This script tests the complete workflow for one family

Write-Host "=== Testing Single Family Workflow ===" -ForegroundColor Green

# Step 1: Create a price plan
Write-Host "`n1. Creating a price plan..." -ForegroundColor Yellow
$pricePlanBody = @{
    title = "Basic Family Plan"
    description = "Monthly family subscription"
    yearlyPrice = 1200
    monthlyPrice = 100
    features = @("Family access", "Monthly statements", "Payment tracking")
} | ConvertTo-Json

$pricePlanResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/price-plans" -Method POST -Body $pricePlanBody -ContentType "application/json"
Write-Host "Price plan created: $($pricePlanResponse.pricePlan.title)" -ForegroundColor Green

# Step 2: Add a member to the family
Write-Host "`n2. Adding a member to the family..." -ForegroundColor Yellow
$memberBody = @{
    firstName = "John"
    lastName = "Goldberger"
    email = "john@example.com"
    phone = "+1234567891"
    familyId = "e40e4a183dfd346e6b4705504e36c78a"
    role = "member"
} | ConvertTo-Json

$memberResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/members" -Method POST -Body $memberBody -ContentType "application/json"
Write-Host "Member added: $($memberResponse.member.firstName) $($memberResponse.member.lastName)" -ForegroundColor Green

# Step 3: Create a subscription
Write-Host "`n3. Creating a subscription..." -ForegroundColor Yellow
$subscriptionBody = @{
    memberId = $memberResponse.member.id
    pricePlanId = $pricePlanResponse.pricePlan.id
    startDate = (Get-Date).ToString("yyyy-MM-dd")
} | ConvertTo-Json

$subscriptionResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions" -Method POST -Body $subscriptionBody -ContentType "application/json"
Write-Host "Subscription created for: $($subscriptionResponse.subscription.memberName)" -ForegroundColor Green

# Step 4: Check the generated statement
Write-Host "`n4. Checking generated statement..." -ForegroundColor Yellow
$statementsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/statements?memberId=$($memberResponse.member.id)" -Method GET
Write-Host "Found $($statementsResponse.statements.Count) statements" -ForegroundColor Green

if ($statementsResponse.statements.Count -gt 0) {
    $firstStatement = $statementsResponse.statements[0]
    Write-Host "First statement: Amount $($firstStatement.amount), Status: $($firstStatement.status)" -ForegroundColor Cyan
}

# Step 5: Process a payment
Write-Host "`n5. Processing a payment..." -ForegroundColor Yellow
if ($statementsResponse.statements.Count -gt 0) {
    $paymentBody = @{
        statementId = $statementsResponse.statements[0].id
        amount = $statementsResponse.statements[0].amount
        paymentMethod = "credit_card"
        reference = "PAY-$(Get-Date -Format 'yyyyMMddHHmmss')"
    } | ConvertTo-Json

    $paymentResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/statements" -Method POST -Body $paymentBody -ContentType "application/json"
    Write-Host "Payment processed: $($paymentResponse.payment.reference)" -ForegroundColor Green
}

# Step 6: Generate next month's statement
Write-Host "`n6. Generating next month's statement..." -ForegroundColor Yellow
$nextMonthBody = @{
    action = "generate-next-month"
    memberId = $memberResponse.member.id
} | ConvertTo-Json

$nextMonthResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/subscriptions" -Method PUT -Body $nextMonthBody -ContentType "application/json"
Write-Host "Next month statement generated: $($nextMonthResponse.statement.month)/$($nextMonthResponse.statement.year)" -ForegroundColor Green

# Step 7: Check all statements for the member
Write-Host "`n7. Checking all statements for the member..." -ForegroundColor Yellow
$allStatementsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/statements?memberId=$($memberResponse.member.id)" -Method GET
Write-Host "Total statements: $($allStatementsResponse.statements.Count)" -ForegroundColor Green

foreach ($statement in $allStatementsResponse.statements) {
    Write-Host "  - $($statement.month)/$($statement.year): $($statement.amount) (Status: $($statement.status))" -ForegroundColor Cyan
}

Write-Host "`n=== Single Family Workflow Test Complete ===" -ForegroundColor Green
