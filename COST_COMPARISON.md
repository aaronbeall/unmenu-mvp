# Cost Comparison: DALL-E vs Image Libraries

## Summary

**Switching from DALL-E to image libraries reduces costs by ~94%**

## Detailed Breakdown

### Option 1: DALL-E 3 (Current Implementation)

#### Costs per Scan
- **GPT-4o Vision**: $0.01-0.03 per menu analysis
- **DALL-E 3**: $0.04 per image (standard quality)
- **Average menu**: 8 items
- **Total per scan**: $0.02 + ($0.04 × 8) = **$0.34**

#### Monthly Costs
| Tier | Scans/Month | Cost/User | Revenue | Margin |
|------|-------------|-----------|---------|--------|
| Free | 5 | $1.70 | $0 | -$1.70 |
| Pro | 100 | $34.00 | $9.99 | -$24.01 |

**Problem**: Negative margins on Pro tier! 📉

---

### Option 2: Pexels API (Free)

#### Costs per Scan
- **GPT-4o Vision**: $0.01-0.03
- **Pexels API**: $0 (free, unlimited)
- **Total per scan**: **$0.02**

#### Monthly Costs
| Tier | Scans/Month | Cost/User | Revenue | Margin |
|------|-------------|-----------|---------|--------|
| Free | 5 | $0.10 | $0 | -$0.10 |
| Pro | 100 | $2.00 | $9.99 | **+$7.99** |

**Benefit**: 80% profit margin! ✅

#### Setup
```bash
# Get free API key from pexels.com
supabase secrets set PEXELS_API_KEY=your-key

# Deploy updated function
supabase functions deploy scan-menu
```

#### Pros
- ✅ Completely free
- ✅ No attribution required
- ✅ High quality images
- ✅ 80,000+ food photos
- ✅ Fast response times

#### Cons
- ⚠️ Generic images (not dish-specific)
- ⚠️ May not match exact dish

---

### Option 3: Unsplash API (Free with Attribution)

#### Costs per Scan
- **GPT-4o Vision**: $0.01-0.03
- **Unsplash API**: $0 (free, 50 requests/hour)
- **Total per scan**: **$0.02**

#### Monthly Costs
Same as Pexels (80% margin)

#### Setup
```bash
# Get free API key from unsplash.com/developers
supabase secrets set UNSPLASH_ACCESS_KEY=your-key
```

#### Pros
- ✅ Free (50 req/hour)
- ✅ Highest quality images
- ✅ 3M+ photos
- ✅ Professional photography

#### Cons
- ⚠️ Requires attribution in UI
- ⚠️ Rate limit (50/hour)
- ⚠️ Generic images

---

### Option 4: Curated Database (Best)

#### Implementation
Pre-populate database with high-quality Unsplash URLs for common dishes.

#### Costs per Scan
- **GPT-4o Vision**: $0.01-0.03
- **Image lookup**: $0 (database query)
- **Total per scan**: **$0.02**

#### Setup Time
- Initial curation: 2-4 hours
- Add 100-200 common dishes
- Update quarterly

#### Pros
- ✅ Completely free
- ✅ Instant (no API calls)
- ✅ Curated quality
- ✅ Consistent branding
- ✅ No rate limits
- ✅ Offline capable

#### Cons
- ⚠️ Requires initial curation
- ⚠️ Limited to curated dishes
- ⚠️ Needs maintenance

---

### Option 5: Hybrid Approach (Recommended)

**Strategy**: Curated DB → Pexels API → Placeholder

```typescript
async function getFoodImage(dishName: string): Promise<string> {
  // 1. Try curated database (instant, free, best quality)
  const curatedImage = getCuratedImage(dishName);
  if (curatedImage) return curatedImage;
  
  // 2. Try Pexels API (free, good quality)
  const pexelsImage = await getPexelsFoodImage(dishName);
  if (pexelsImage) return pexelsImage;
  
  // 3. Fallback to generic food image
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';
}
```

#### Costs per Scan
- **GPT-4o Vision**: $0.02
- **Images**: $0
- **Total**: **$0.02**

#### Coverage
- 80% curated (instant)
- 15% Pexels API (2-3s)
- 5% placeholder

#### Pros
- ✅ Best of all worlds
- ✅ 80% instant results
- ✅ Always has an image
- ✅ Scalable
- ✅ 80% profit margin

---

## Migration Path

### Phase 1: Quick Win (1 hour)
1. Add Pexels API key
2. Replace DALL-E calls with Pexels
3. Deploy
4. **Save 94% immediately**

### Phase 2: Optimization (4 hours)
1. Curate 100 popular dishes
2. Add curated database
3. Implement hybrid fallback
4. **95% instant results**

### Phase 3: Enhancement (ongoing)
1. Track which dishes need images
2. Curate based on usage data
3. Add regional specialties
4. **99% coverage over time**

---

## Recommendation

**Use Hybrid Approach (Option 5)**

### Implementation
```bash
# 1. Add Pexels API key
supabase secrets set PEXELS_API_KEY=your-key

# 2. Deploy updated function
cp supabase/functions/scan-menu/index-with-image-library.ts \
   supabase/functions/scan-menu/index.ts
supabase functions deploy scan-menu

# 3. Update pricing (optional)
# Free tier: 10 scans/month (was 5)
# Pro tier: $4.99/month (was $9.99)
```

### Expected Results
- **Cost reduction**: 94%
- **Profit margin**: 80%
- **User experience**: Similar or better
- **Speed**: 3x faster (no DALL-E generation)
- **Scalability**: Much better

---

## Image Quality Comparison

### DALL-E 3
- ✅ Dish-specific
- ✅ Perfect match to description
- ❌ Sometimes unrealistic
- ❌ Expensive
- ❌ Slow (10-30s per image)

### Pexels/Unsplash
- ✅ Professional photography
- ✅ Realistic
- ✅ Free
- ✅ Fast (1-2s)
- ⚠️ Generic (not exact dish)

### User Perception
Most users won't notice the difference. They care more about:
1. Having an image (vs no image)
2. Image quality (both are high)
3. App speed (library is faster)

---

## Alternative: Hybrid AI Approach

If you want dish-specific images but lower cost:

### Use Stable Diffusion XL
- **Cost**: $0.002 per image (95% cheaper than DALL-E)
- **Quality**: Similar to DALL-E
- **Speed**: 5-10s per image
- **Provider**: Replicate, Together AI, or self-hosted

### Implementation
```typescript
// Use Replicate API
const response = await fetch('https://api.replicate.com/v1/predictions', {
  method: 'POST',
  headers: {
    'Authorization': `Token ${REPLICATE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    version: 'stability-ai/sdxl',
    input: {
      prompt: `Professional food photography of ${dishName}, appetizing, restaurant menu style`,
    },
  }),
});
```

### Costs with SDXL
- **Per scan**: $0.02 (GPT-4o) + $0.016 (8 images) = **$0.036**
- **Savings vs DALL-E**: 89%
- **Pro tier margin**: $9.99 - $3.60 = **$6.39** (64%)

---

## Final Recommendation

**Start with Hybrid Image Library (Option 5)**

Then consider:
- If users complain about generic images → Add SDXL
- If margins are good → Keep as-is
- If you want premium tier → Offer DALL-E as $19.99/month option

**Bottom line**: Image libraries give you 94% cost savings with minimal UX impact.
