# Panels Module - Usage Examples

## 📚 Real-World Usage Examples

---

## 1️⃣ Admin Creates a New Panel

**Scenario:** Admin creates a "Women's Wellness Complete" panel with 6 tests

```bash
curl -X POST http://localhost:3000/api/panels \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Women'\''s Wellness Complete",
    "slug": "womens-wellness-complete",
    "shortDescription": "Comprehensive hormone and health panel for women",
    "description": "Full health assessment panel for women including hormone levels, blood count, metabolic panel, thyroid function, and kidney/liver function tests.",
    "basePrice": 299.99,
    "discountPercent": 15,
    "heroImage": "https://cdn.example.com/womens-wellness-hero.jpg",
    "bannerLabel": "Save 15%",
    "isActive": true,
    "startsAt": "2025-01-01T00:00:00Z",
    "endsAt": "2025-03-31T23:59:59Z",
    "testIds": [
      "cbc-test-uuid",
      "metabolic-panel-uuid",
      "hormone-panel-uuid",
      "thyroid-function-uuid",
      "liver-kidney-uuid",
      "lipid-panel-uuid"
    ]
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Test panel created successfully",
  "data": {
    "id": "panel-550e8400-e29b-41d4-a716-446655440000",
    "name": "Women's Wellness Complete",
    "slug": "womens-wellness-complete",
    "shortDescription": "Comprehensive hormone and health panel for women",
    "basePrice": 299.99,
    "discountPercent": 15,
    "bundlePrice": 254.99,
    "heroImage": "https://cdn.example.com/womens-wellness-hero.jpg",
    "bannerLabel": "Save 15%",
    "isActive": true,
    "startsAt": "2025-01-01T00:00:00Z",
    "endsAt": "2025-03-31T23:59:59Z",
    "testsCount": 6,
    "tests": [
      {
        "id": "cbc-test-uuid",
        "testCode": "CBC",
        "testName": "Complete Blood Count",
        "price": 45.0,
        "testImage": "https://cdn.example.com/cbc.jpg",
        "sortOrder": 0
      },
      {
        "id": "metabolic-panel-uuid",
        "testCode": "MP",
        "testName": "Metabolic Panel",
        "price": 55.0,
        "sortOrder": 1
      },
      {
        "id": "hormone-panel-uuid",
        "testCode": "HORMONE",
        "testName": "Female Hormone Panel",
        "price": 89.99,
        "sortOrder": 2
      },
      {
        "id": "thyroid-function-uuid",
        "testCode": "TSH",
        "testName": "Thyroid Function Test",
        "price": 35.0,
        "sortOrder": 3
      },
      {
        "id": "liver-kidney-uuid",
        "testCode": "LK",
        "testName": "Liver & Kidney Function",
        "price": 45.0,
        "sortOrder": 4
      },
      {
        "id": "lipid-panel-uuid",
        "testCode": "LIPID",
        "testName": "Lipid Panel",
        "price": 30.0,
        "sortOrder": 5
      }
    ],
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

---

## 2️⃣ Customer Browses All Panels

**Scenario:** Customer wants to see all available panels

```bash
curl "http://localhost:3000/api/panels" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "message": "Test panels retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 5
  },
  "data": [
    {
      "id": "panel-1",
      "name": "Women's Wellness Complete",
      "slug": "womens-wellness-complete",
      "basePrice": 299.99,
      "discountPercent": 15,
      "bundlePrice": 254.99,
      "bannerLabel": "Save 15%",
      "testsCount": 6,
      "isActive": true
    },
    {
      "id": "panel-2",
      "name": "Men's Complete Health",
      "slug": "mens-complete-health",
      "basePrice": 279.99,
      "discountPercent": 18,
      "bundlePrice": 229.39,
      "bannerLabel": "Save 18%",
      "testsCount": 5,
      "isActive": true
    },
    {
      "id": "panel-3",
      "name": "Energy & Vitality Panel",
      "slug": "energy-vitality-panel",
      "basePrice": 199.99,
      "discountPercent": 16,
      "bundlePrice": 167.99,
      "bannerLabel": "Save 16%",
      "testsCount": 5,
      "isActive": true
    }
  ]
}
```

---

## 3️⃣ Customer Searches for Wellness Panels

**Scenario:** Customer searches for "wellness" with pagination

```bash
curl "http://localhost:3000/api/panels?searchTerm=wellness&page=1&limit=5" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "message": "Test panels retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 5,
    "total": 2
  },
  "data": [
    {
      "id": "panel-1",
      "name": "Women's Wellness Complete",
      "slug": "womens-wellness-complete",
      "basePrice": 299.99,
      "bundlePrice": 254.99,
      "testsCount": 6
    },
    {
      "id": "panel-4",
      "name": "Essential Wellness Screening",
      "slug": "essential-wellness-screening",
      "basePrice": 89.99,
      "bundlePrice": 77.29,
      "testsCount": 3
    }
  ]
}
```

---

## 4️⃣ Customer Filters Panels by Price Range

**Scenario:** Customer wants panels between $100-$300

```bash
curl "http://localhost:3000/api/panels?minPrice=100&maxPrice=300&sortBy=basePrice&sortOrder=asc" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "message": "Test panels retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 3
  },
  "data": [
    {
      "id": "panel-5",
      "name": "Essential Health Screening",
      "slug": "essential-health-screening",
      "basePrice": 104.99,
      "bundlePrice": 89.99,
      "discountPercent": 14,
      "testsCount": 3
    },
    {
      "id": "panel-3",
      "name": "Energy & Vitality Panel",
      "slug": "energy-vitality-panel",
      "basePrice": 199.99,
      "bundlePrice": 167.99,
      "discountPercent": 16,
      "testsCount": 5
    },
    {
      "id": "panel-1",
      "name": "Women's Wellness Complete",
      "slug": "womens-wellness-complete",
      "basePrice": 299.99,
      "bundlePrice": 254.99,
      "discountPercent": 15,
      "testsCount": 6
    }
  ]
}
```

---

## 5️⃣ Customer Views Specific Panel Details

**Scenario:** Customer wants to see full details of "Women's Wellness Complete"

```bash
curl "http://localhost:3000/api/panels/panel-550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "message": "Test panel retrieved successfully",
  "data": {
    "id": "panel-550e8400-e29b-41d4-a716-446655440000",
    "name": "Women's Wellness Complete",
    "slug": "womens-wellness-complete",
    "shortDescription": "Comprehensive hormone and health panel for women",
    "description": "Full health assessment panel for women including hormone levels, blood count, metabolic panel, thyroid function, and kidney/liver function tests.",
    "basePrice": 299.99,
    "discountPercent": 15,
    "bundlePrice": 254.99,
    "heroImage": "https://cdn.example.com/womens-wellness-hero.jpg",
    "bannerLabel": "Save 15%",
    "isActive": true,
    "startsAt": "2025-01-01T00:00:00Z",
    "endsAt": "2025-03-31T23:59:59Z",
    "testsCount": 6,
    "tests": [
      {
        "id": "cbc-test-uuid",
        "testCode": "CBC",
        "testName": "Complete Blood Count",
        "price": 45.0,
        "testImage": "https://cdn.example.com/tests/cbc.jpg",
        "description": "Measures white blood cells, red blood cells, hemoglobin, hematocrit, and platelets",
        "sortOrder": 0
      },
      {
        "id": "metabolic-panel-uuid",
        "testCode": "MP",
        "testName": "Metabolic Panel",
        "price": 55.0,
        "description": "Measures glucose, calcium, protein, kidney and liver function",
        "sortOrder": 1
      },
      {
        "id": "hormone-panel-uuid",
        "testCode": "HORMONE",
        "testName": "Female Hormone Panel",
        "price": 89.99,
        "description": "Estrogen, progesterone, FSH, LH levels",
        "sortOrder": 2
      },
      {
        "id": "thyroid-function-uuid",
        "testCode": "TSH",
        "testName": "Thyroid Function Test",
        "price": 35.0,
        "description": "TSH, T3, and T4 levels",
        "sortOrder": 3
      },
      {
        "id": "liver-kidney-uuid",
        "testCode": "LK",
        "testName": "Liver & Kidney Function",
        "price": 45.0,
        "description": "AST, ALT, GGT, BUN, creatinine",
        "sortOrder": 4
      },
      {
        "id": "lipid-panel-uuid",
        "testCode": "LIPID",
        "testName": "Lipid Panel",
        "price": 30.0,
        "description": "Total cholesterol, LDL, HDL, triglycerides",
        "sortOrder": 5
      }
    ],
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

---

## 6️⃣ Admin Updates Panel Pricing

**Scenario:** Admin wants to increase discount from 15% to 20% for Women's Wellness

```bash
curl -X PATCH http://localhost:3000/api/panels/panel-550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "discountPercent": 20
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Test panel updated successfully",
  "data": {
    "id": "panel-550e8400-e29b-41d4-a716-446655440000",
    "name": "Women's Wellness Complete",
    "basePrice": 299.99,
    "discountPercent": 20,
    "bundlePrice": 239.99,
    "bannerLabel": "Save 20%",
    "updatedAt": "2025-01-16T14:30:00Z",
    ...
  }
}
```

---

## 7️⃣ Admin Reorders Tests in Panel

**Scenario:** Admin wants to change the order of tests in the panel

```bash
curl -X PATCH http://localhost:3000/api/panels/panel-550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "testIds": [
      "hormone-panel-uuid",
      "thyroid-function-uuid",
      "cbc-test-uuid",
      "metabolic-panel-uuid",
      "lipid-panel-uuid",
      "liver-kidney-uuid"
    ]
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Test panel updated successfully",
  "data": {
    "id": "panel-550e8400-e29b-41d4-a716-446655440000",
    "tests": [
      {
        "id": "hormone-panel-uuid",
        "testName": "Female Hormone Panel",
        "sortOrder": 0
      },
      {
        "id": "thyroid-function-uuid",
        "testName": "Thyroid Function Test",
        "sortOrder": 1
      },
      ...
    ]
  }
}
```

---

## 8️⃣ Admin Deactivates Panel

**Scenario:** Admin wants to hide a panel from customers

```bash
curl -X PATCH http://localhost:3000/api/panels/panel-550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

---

## 9️⃣ Admin Deletes Panel

**Scenario:** Admin wants to remove an outdated panel

```bash
curl -X DELETE http://localhost:3000/api/panels/panel-550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "message": "Test panel deleted successfully",
  "data": {
    "id": "panel-550e8400-e29b-41d4-a716-446655440000",
    "name": "Women's Wellness Complete",
    "slug": "womens-wellness-complete",
    "basePrice": 299.99,
    "discountPercent": 20,
    "bundlePrice": 239.99,
    "testsCount": 6
  }
}
```

---

## 🔟 Advanced Filtering - Multiple Criteria

**Scenario:** Admin wants to see all active panels priced $150-$300, sorted by discount

```bash
curl "http://localhost:3000/api/panels?isActive=true&minPrice=150&maxPrice=300&sortBy=discountPercent&sortOrder=desc&page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**

```json
{
  "success": true,
  "message": "Test panels retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 3
  },
  "data": [
    {
      "id": "panel-2",
      "name": "STD Comprehensive Screening",
      "slug": "std-comprehensive-screening",
      "basePrice": 199.99,
      "discountPercent": 20,
      "bundlePrice": 159.99,
      "isActive": true
    },
    {
      "id": "panel-3",
      "name": "Energy & Vitality Panel",
      "slug": "energy-vitality-panel",
      "basePrice": 199.99,
      "discountPercent": 16,
      "bundlePrice": 167.99,
      "isActive": true
    },
    {
      "id": "panel-1",
      "name": "Women's Wellness Complete",
      "slug": "womens-wellness-complete",
      "basePrice": 299.99,
      "discountPercent": 15,
      "bundlePrice": 254.99,
      "isActive": true
    }
  ]
}
```

---

## Error Handling Examples

### ❌ Unauthorized Access (Non-Admin Trying to Create)

```bash
curl -X POST http://localhost:3000/api/panels \
  -H "Authorization: Bearer customer-token" \
  -d '{...}'
```

**Response (403):**

```json
{
  "success": false,
  "message": "Forbidden"
}
```

### ❌ Duplicate Slug

```bash
curl -X POST http://localhost:3000/api/panels \
  -H "Authorization: Bearer admin-token" \
  -d '{
    "name": "New Panel",
    "slug": "womens-wellness-complete",
    ...
  }'
```

**Response (409):**

```json
{
  "success": false,
  "message": "Panel slug already exists"
}
```

### ❌ Invalid Test IDs

```bash
curl -X POST http://localhost:3000/api/panels \
  -H "Authorization: Bearer admin-token" \
  -d '{
    "name": "New Panel",
    "slug": "new-panel",
    "testIds": ["invalid-uuid", "another-invalid-uuid"]
  }'
```

**Response (400):**

```json
{
  "success": false,
  "message": "One or more test IDs do not exist"
}
```

### ❌ Panel Not Found

```bash
curl http://localhost:3000/api/panels/non-existent-id \
  -H "Authorization: Bearer token"
```

**Response (404):**

```json
{
  "success": false,
  "message": "Panel not found"
}
```

---

## 📊 JavaScript/TypeScript Client Example

```typescript
// Get all active panels under $300
const getPanels = async (token: string) => {
  const response = await fetch(
    'http://localhost:3000/api/panels?isActive=true&maxPrice=300&limit=10',
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response.json();
};

// Create a new panel (admin)
const createPanel = async (adminToken: string, panelData: any) => {
  const response = await fetch('http://localhost:3000/api/panels', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(panelData),
  });
  return response.json();
};

// Get specific panel details
const getPanelDetails = async (panelId: string, token: string) => {
  const response = await fetch(`http://localhost:3000/api/panels/${panelId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

// Update panel discount
const updatePanel = async (panelId: string, adminToken: string, updates: any) => {
  const response = await fetch(`http://localhost:3000/api/panels/${panelId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  return response.json();
};
```

---

These examples demonstrate all major use cases for the panels module!
