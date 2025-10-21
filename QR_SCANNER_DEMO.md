# QR Scanner Demo & Testing Guide

## Quick Start Demo

### 1. Generate Your First QR Code

```
Navigate to: http://localhost:5173/qr

Steps:
1. Click "Generate QR Code" tab
2. QR code is automatically generated with:
   - Batch Number: BATCH-2025-001
   - Your organization info
   - Current date
3. Click "Generate QR Code" button
4. QR code appears with download option
```

**What You'll See:**
- A QR code image (512x512px)
- Batch information panel
- Download button
- IPFS upload option
- Printable label generator

### 2. Test Camera Scanning

```
Navigate to: http://localhost:5173/qr

Steps:
1. Click "Scan QR Code" tab
2. Click "Start Camera Scanning"
3. Allow camera permission
4. Point camera at QR code
5. Wait for automatic detection
```

**What Happens:**
- Camera preview appears
- QR code detected in < 1 second
- Data validated automatically
- Redirects to batch details
- Full supply chain displayed

### 3. Test File Upload

```
Navigate to: http://localhost:5173/qr

Steps:
1. Click "Scan QR Code" tab
2. Click "Upload QR Code Image"
3. Select QR code image file
4. Wait for processing
```

**What Happens:**
- File picker opens
- Image uploaded and scanned
- QR data extracted
- Validation performed
- Results displayed

### 4. Test Manual Entry

```
Navigate to: http://localhost:5173/track

Steps:
1. Enter batch ID (e.g., "123")
2. Click "Track" button
3. Wait for blockchain fetch
```

**What Happens:**
- Batch ID validated
- Blockchain queried
- Supply chain data fetched
- Complete history displayed

### 5. Test with Standard QR App

```
Using Any QR Scanner App:

Steps:
1. Open phone camera or QR app
2. Point at generated QR code
3. Click the URL that appears
4. Browser opens verification page
```

**What You'll See:**
```
URL Format:
https://yourapp.com/verify/123

Page Shows:
- Batch number and status
- Collection phase data
- Testing phase data
- Processing phase data
- Manufacturing phase data
- Blockchain verification badge
```

## Testing Scenarios

### Scenario 1: Complete Supply Chain

**Setup:**
1. Generate batch in Collection phase
2. Add Testing data
3. Add Processing data
4. Add Manufacturing data
5. Generate final QR code

**Test:**
1. Scan QR code
2. Verify all phases display
3. Check data accuracy
4. Verify timestamps

**Expected Result:**
- All 4 phases visible
- Correct data in each phase
- GPS locations shown
- Ratings displayed
- Dates accurate

### Scenario 2: Partial Supply Chain

**Setup:**
1. Generate batch in Collection phase only
2. Generate QR code

**Test:**
1. Scan QR code
2. Check displayed phases

**Expected Result:**
- Collection phase shows data
- Other phases show "Not yet completed"
- Batch status: Active
- Current phase: Collection

### Scenario 3: IPFS Metadata

**Setup:**
1. Generate QR code
2. Upload to IPFS (optional)
3. Note IPFS hash

**Test:**
1. Scan QR code with IPFS hash
2. Check if IPFS data loads

**Expected Result:**
- IPFS badge appears
- Link to IPFS gateway
- Additional metadata shown
- Images/docs displayed (if any)

### Scenario 4: Public Access

**Setup:**
1. Generate and save QR code
2. Share verification URL
3. Open in incognito/different browser

**Test:**
1. Access URL without logging in
2. Check data visibility

**Expected Result:**
- Page loads without login
- All blockchain data visible
- No user-specific features
- Share buttons available

### Scenario 5: Error Handling

**Test A: Invalid Batch ID**
```
Steps:
1. Enter "invalid-batch-999"
2. Click Track

Expected:
- "Batch not found" message
- Helpful error text
- Try again option
```

**Test B: Camera Permission Denied**
```
Steps:
1. Deny camera permission
2. Try to scan

Expected:
- Permission request message
- Alternative options shown
- File upload available
- Manual entry available
```

**Test C: Corrupted QR Code**
```
Steps:
1. Create damaged QR image
2. Upload file

Expected:
- "Invalid QR format" message
- Clear error explanation
- Retry option
```

## Visual Testing Checklist

### QR Scanner Component

- [ ] Camera button displays
- [ ] File upload button displays
- [ ] Manual entry button displays
- [ ] Camera preview works
- [ ] Stop scanning button works
- [ ] Error messages display correctly
- [ ] Success messages display correctly
- [ ] Permission warnings show

### Batch Details Viewer

- [ ] Header displays batch info
- [ ] Phase badges show correctly
- [ ] GPS coordinates format properly
- [ ] Timestamps are readable
- [ ] Addresses are shortened
- [ ] All data fields populate
- [ ] IPFS badge shows (if applicable)
- [ ] Blockchain badge displays
- [ ] Close button works

### Public Tracker Page

- [ ] Search bar works
- [ ] Scanner integrates properly
- [ ] Results display correctly
- [ ] Back navigation works
- [ ] Mobile responsive
- [ ] Share functionality works

### QR Management Page

- [ ] Generate tab works
- [ ] Scan tab works
- [ ] List tab works
- [ ] QR codes display
- [ ] Download works
- [ ] IPFS upload works
- [ ] Certificate generation works
- [ ] Statistics update

## Performance Testing

### Load Time Tests

```
Test 1: Initial Page Load
Target: < 1 second
Measure: Time to interactive

Test 2: Camera Initialization
Target: < 2 seconds
Measure: Camera ready to scan

Test 3: Blockchain Fetch
Target: 2-3 seconds
Measure: Time to display data

Test 4: IPFS Fetch
Target: 1-2 seconds
Measure: Time to load metadata
```

### Stress Tests

```
Test 1: Multiple Scans
Action: Scan 10 QR codes in succession
Expected: No memory leaks, smooth operation

Test 2: Large Batch History
Action: Load batch with 1000+ records
Expected: Pagination or lazy loading works

Test 3: Slow Network
Action: Test on 3G connection
Expected: Loading indicators, graceful degradation
```

## Mobile Testing

### iOS Testing

```
Devices to Test:
- iPhone 11+
- iPad Pro
- Safari browser

Features to Test:
- Camera access
- File upload
- Touch controls
- Orientation changes
```

### Android Testing

```
Devices to Test:
- Samsung Galaxy S20+
- Google Pixel 5+
- Chrome browser

Features to Test:
- Camera access
- File upload
- Touch controls
- Back button
```

## Browser Compatibility

### Desktop Browsers

```
Chrome/Edge:
- Version 90+
- Camera: ✓
- File Upload: ✓
- Performance: Excellent

Firefox:
- Version 88+
- Camera: ✓
- File Upload: ✓
- Performance: Good

Safari:
- Version 14+
- Camera: ✓
- File Upload: ✓
- Performance: Good
```

### Mobile Browsers

```
Chrome Mobile:
- Camera: ✓
- File Upload: ✓
- Performance: Excellent

Safari iOS:
- Camera: ✓
- File Upload: ✓
- Performance: Good

Samsung Internet:
- Camera: ✓
- File Upload: ✓
- Performance: Good
```

## Debugging Tips

### QR Code Not Scanning

```
Check:
1. Camera permission granted?
2. Good lighting?
3. QR code clear and visible?
4. Try file upload instead

Debug:
- Open browser console
- Check for camera errors
- Verify QR data format
- Test with different QR code
```

### Batch Not Found

```
Check:
1. Batch ID correct?
2. Blockchain connection?
3. Network selection?
4. Contract address?

Debug:
- Verify batch exists on blockchain
- Check RPC endpoint
- Test contract read functions
- Verify network (Base Sepolia)
```

### IPFS Not Loading

```
Check:
1. IPFS hash valid?
2. Gateway accessible?
3. Network connection?

Debug:
- Test IPFS URL directly
- Check gateway status
- Try alternative gateway
- Continue without IPFS
```

## Demo Script for Presentations

### 5-Minute Demo

```
Minute 1: Introduction
"This is FoodTrace, a blockchain-based food supply chain tracker."

Minute 2: QR Generation
"Here's how supply chain operators generate QR codes for batches."
[Generate QR code, show batch info]

Minute 3: Scanning
"Consumers can scan these QR codes with any scanner app."
[Scan with phone camera, show URL detection]

Minute 4: Verification
"The verification page shows the complete supply chain history."
[Display batch details, explain each phase]

Minute 5: Trust & Transparency
"All data is verified on blockchain and immutable."
[Show blockchain badge, explain trust]
```

### 15-Minute Deep Dive

```
Minutes 1-3: Overview
- What is FoodTrace
- Why blockchain for food
- The trust problem

Minutes 4-7: Supply Chain Workflow
- Collection phase demo
- Testing phase demo
- Processing phase demo
- Manufacturing phase demo

Minutes 8-11: QR System
- QR generation walkthrough
- Multiple scanning methods
- Standard app compatibility
- Public verification

Minutes 12-14: Technical Features
- Blockchain integration
- IPFS metadata
- Real-time validation
- Security features

Minute 15: Q&A
- Answer questions
- Show additional features
- Discuss customization
```

## Success Metrics

Track these metrics:

```
User Engagement:
- QR codes generated
- QR codes scanned
- Public page visits
- Average view duration

Performance:
- Average scan time
- Page load time
- Error rate
- Success rate

Business:
- Batches tracked
- Supply chain completions
- User satisfaction
- Return visits
```

## Next Level Testing

### Load Testing

```
Tools:
- Apache JMeter
- Locust
- k6

Tests:
- 100 concurrent scanners
- 1000 batch lookups/minute
- Peak usage simulation
```

### Security Testing

```
Tests:
- XSS attempts
- SQL injection (if applicable)
- QR data tampering
- Network attacks
```

### Accessibility Testing

```
Tests:
- Screen reader compatibility
- Keyboard navigation
- Color contrast
- ARIA labels
```

## Support Resources

If you encounter issues:

1. Check `QR_SCANNER_IMPLEMENTATION.md` for technical details
2. Review `QR_SCANNER_ARCHITECTURE.md` for system design
3. See `QR_CODE_USAGE.md` for QR generation
4. Check browser console for errors
5. Verify environment variables in `.env`

## Ready to Go Live?

Pre-launch checklist:

- [ ] All tests passing
- [ ] Mobile testing complete
- [ ] Performance optimized
- [ ] Error handling verified
- [ ] Analytics configured
- [ ] Documentation updated
- [ ] User training complete
- [ ] Support system ready

Your QR scanner system is production-ready!
