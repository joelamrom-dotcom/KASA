# Performance Optimization Integration Examples

This guide shows how to use the new performance features in your pages.

## Option 1: Quick Start - Use Existing Components

Your existing components already benefit from:
- ✅ React Query Provider (automatic caching)
- ✅ Request deduplication
- ✅ Redis caching (if enabled)
- ✅ Optimized Next.js config

**No code changes needed** - your app is already faster!

## Option 2: Migrate to React Query Hooks (Recommended for New Features)

### Example: Create a New Families List Component

```tsx
'use client'

import { useFamilies, usePrefetchFamily } from '@/app/hooks/useFamilies'
import VirtualTable from '@/app/components/VirtualTable'
import { useRouter } from 'next/navigation'

export default function FamiliesListOptimized() {
  const router = useRouter()
  const { data: families, isLoading, error } = useFamilies()
  const prefetchFamily = usePrefetchFamily()

  if (isLoading) {
    return <div>Loading families...</div>
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <VirtualTable
      data={families || []}
      columns={[
        { key: 'name', header: 'Family Name', width: 200 },
        { key: 'email', header: 'Email', width: 200 },
        { 
          key: 'weddingDate', 
          header: 'Wedding Date',
          render: (family) => new Date(family.weddingDate).toLocaleDateString()
        },
        { key: 'memberCount', header: 'Members', width: 100 },
        { 
          key: 'openBalance', 
          header: 'Balance',
          render: (family) => `$${family.openBalance.toLocaleString()}`
        }
      ]}
      rowHeight={60}
      onRowHover={(family) => {
        // Prefetch family details on hover for instant navigation
        if (family) prefetchFamily(family._id)
      }}
      onRowClick={(family) => {
        // Navigate to family details
        router.push(`/families/${family._id}`)
      }}
    />
  )
}
```

### Example: Create/Update with Optimistic Updates

```tsx
'use client'

import { useCreateFamily, useUpdateFamily } from '@/app/hooks/useFamilies'
import { showToast } from '@/lib/toast'

export default function FamilyForm({ family, onSuccess }) {
  const createFamily = useCreateFamily()
  const updateFamily = useUpdateFamily()
  
  const handleSubmit = async (formData) => {
    try {
      if (family) {
        // Update existing - UI updates instantly!
        await updateFamily.mutateAsync({
          id: family._id,
          data: formData
        })
        showToast('Family updated!', 'success')
      } else {
        // Create new - appears in list immediately!
        await createFamily.mutateAsync(formData)
        showToast('Family created!', 'success')
      }
      onSuccess?.()
    } catch (error) {
      showToast('Error saving family', 'error')
    }
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      handleSubmit(Object.fromEntries(formData))
    }}>
      {/* Your form fields */}
      <button 
        type="submit"
        disabled={createFamily.isPending || updateFamily.isPending}
      >
        {createFamily.isPending || updateFamily.isPending 
          ? 'Saving...' 
          : 'Save'}
      </button>
    </form>
  )
}
```

## Option 3: Add Virtual Scrolling to Existing Tables

If you have a large table (500+ rows), wrap it with VirtualTable:

### Before (Regular Table):
```tsx
<table>
  <tbody>
    {payments.map(payment => (
      <tr key={payment._id}>
        <td>{payment.familyId.name}</td>
        <td>${payment.amount}</td>
        <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
      </tr>
    ))}
  </tbody>
</table>
```

### After (Virtual Scrolling):
```tsx
<VirtualTable
  data={payments}
  columns={[
    { 
      key: 'familyId', 
      header: 'Family',
      render: (payment) => payment.familyId.name
    },
    { 
      key: 'amount', 
      header: 'Amount',
      render: (payment) => `$${payment.amount.toLocaleString()}`
    },
    { 
      key: 'paymentDate', 
      header: 'Date',
      render: (payment) => new Date(payment.paymentDate).toLocaleDateString()
    }
  ]}
  rowHeight={60}
  onRowClick={(payment) => handleViewPayment(payment)}
/>
```

**Result**: Renders 10,000+ rows smoothly!

## Option 4: Add Lazy Loading to Routes

For code splitting on heavy pages:

```tsx
// app/reports/page.tsx
import { createLazyPage } from '@/app/components/LazyLoad'

// Lazy load the heavy reports component
const LazyReportsPage = createLazyPage(() => 
  import('./ReportsContent')
)

export default LazyReportsPage
```

## Option 5: Prefetch on Hover

Add instant navigation by prefetching data on hover:

```tsx
import { usePrefetchFamily } from '@/app/hooks/useFamilies'
import Link from 'next/link'

export default function FamilyLink({ familyId, name }) {
  const prefetchFamily = usePrefetchFamily()
  
  return (
    <Link 
      href={`/families/${familyId}`}
      onMouseEnter={() => prefetchFamily(familyId)}
    >
      {name}
    </Link>
  )
}
```

## Option 6: Use API Streaming for Large Responses

For API routes that return large datasets:

```typescript
// app/api/kasa/families/route.ts
import { streamJsonResponse } from '@/lib/stream-response'
import { Family } from '@/lib/models'

export async function GET() {
  const families = await Family.find().lean()
  
  // Stream response for faster time-to-first-byte
  return streamJsonResponse(families, 50) // 50 items per chunk
}
```

## Performance Monitoring

### In Development

1. **React Query DevTools**: Opens automatically in bottom-right corner
   - View cached queries
   - See stale/fresh data
   - Monitor refetch behavior

2. **Network Tab**: Check for reduced API calls
   - Cached requests return instantly
   - No duplicate simultaneous requests

### In Production

Monitor with React Query metrics:

```tsx
import { useQueryClient } from '@tanstack/react-query'

export function PerformanceMonitor() {
  const queryClient = useQueryClient()
  
  // Get cache statistics
  const cacheSize = queryClient.getQueryCache().getAll().length
  const mutationCount = queryClient.getMutationCache().getAll().length
  
  return (
    <div>
      <p>Cached Queries: {cacheSize}</p>
      <p>Active Mutations: {mutationCount}</p>
    </div>
  )
}
```

## Best Practices

### ✅ DO:
- Use React Query hooks for all API calls
- Add prefetching on hover for better UX
- Use VirtualTable for lists with 100+ items
- Enable Redis for production (set `REDIS_URL`)
- Monitor React Query DevTools in development

### ❌ DON'T:
- Mix direct fetch() with React Query (pick one)
- Disable caching without good reason
- Forget to handle loading/error states
- Skip error boundaries for mutations

## Migration Strategy

You don't need to migrate everything at once! Here's a gradual approach:

### Phase 1: New Features (Immediate)
✅ Use React Query hooks for all new features
✅ Current implementation already benefits from provider

### Phase 2: High-Impact Pages (Optional)
- Migrate heavily-used pages to React Query hooks
- Add VirtualTable to pages with large tables
- Add prefetching to frequently-clicked links

### Phase 3: Complete (Optional)
- Gradually migrate remaining pages
- Add lazy loading to rarely-visited routes
- Optimize images with OptimizedImage component

## Need Help?

Check the documentation:
- `/PERFORMANCE_OPTIMIZATIONS.md` - Full feature list
- `/app/hooks/useFamilies.ts` - Example hook with optimistic updates
- `/app/components/VirtualTable.tsx` - Virtual scrolling component
- `/lib/stream-response.ts` - API streaming utilities

Your app is **already faster** with the infrastructure in place! 🚀
