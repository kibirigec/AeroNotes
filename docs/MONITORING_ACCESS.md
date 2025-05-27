# 📊 Accessing the AeroNotes Monitoring Dashboard

## 🚀 Quick Access Methods

### Method 1: Direct URL Access
Once you're logged in to AeroNotes, you can access the monitoring dashboard directly at:

```
http://localhost:3000/admin/monitoring
```

**For production:**
```
https://your-domain.com/admin/monitoring
```

### Method 2: Admin Access Component
Add the `AdminAccess` component to any page to get quick links:

```jsx
import AdminAccess from '../components/AdminAccess';

function MyPage() {
  return (
    <div>
      {/* Your page content */}
      <AdminAccess />
    </div>
  );
}
```

### Method 3: Navigation Menu
If using the admin layout, navigate through the sidebar:
- Admin Panel → Monitoring

## 🔐 Authentication Requirements

### Current Setup (Development)
- User must be authenticated (have `userId` in localStorage)
- No specific admin role required yet

### Production Recommendations
Update the authentication check in `/src/app/admin/monitoring/page.js`:

```javascript
// Replace this section with proper admin role checking
const checkAuth = async () => {
  try {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
      router.push('/login');
      return;
    }

    // Add admin role check
    const userResponse = await fetch('/api/user/profile', {
      headers: { 'x-user-id': userId }
    });
    const userData = await userResponse.json();
    
    if (!userData.data.profile.isAdmin) {
      setIsAuthorized(false);
      return;
    }

    setIsAuthorized(true);
  } catch (error) {
    console.error('Auth check failed:', error);
    router.push('/login');
  } finally {
    setIsLoading(false);
  }
};
```

## 📊 Dashboard Features

### Available Views
1. **Overview** - System summary with key metrics
2. **Health** - Detailed health check results
3. **Metrics** - Complete metrics data
4. **Cache** - Cache performance statistics

### Real-time Features
- **Auto-refresh**: Configurable intervals (10s, 30s, 1m, 5m)
- **Live alerts**: Active system alerts display
- **Performance metrics**: Request timing and system load

### Key Metrics Displayed
- **System Health**: Overall status and uptime
- **Request Metrics**: Total requests and error rates
- **Memory Usage**: Heap usage with visual indicators
- **Cache Performance**: Hit rates and efficiency

## 🛠️ API Endpoints

The dashboard uses these API endpoints:

### Monitoring Data
```
GET /api/monitoring?type=overview&detailed=false
```

**Parameters:**
- `type`: `overview`, `health`, `metrics`, `cache`
- `detailed`: `true` for complete data, `false` for summary

### Alerts
```
POST /api/monitoring/alerts
```

### Health Check
```
GET /api/health?metrics=true
```

## 🚨 Troubleshooting

### Common Issues

#### 1. "Access Denied" Error
- **Cause**: User not authenticated
- **Solution**: Log in to AeroNotes first

#### 2. "Page Not Found" Error
- **Cause**: Monitoring page not set up
- **Solution**: Ensure files are created:
  - `src/app/admin/monitoring/page.js`
  - `src/app/admin/layout.js`

#### 3. API Errors
- **Cause**: Monitoring API not responding
- **Solution**: Check server logs and ensure monitoring routes are working:
  ```bash
  curl http://localhost:3000/api/health
  ```

#### 4. Component Import Errors
- **Cause**: Incorrect import paths
- **Solution**: Verify file structure and update import paths

### Debug Steps

1. **Check Authentication**:
   ```javascript
   console.log('User ID:', localStorage.getItem('userId'));
   ```

2. **Test API Endpoints**:
   ```bash
   # Health check
   curl http://localhost:3000/api/health
   
   # Monitoring data
   curl http://localhost:3000/api/monitoring
   ```

3. **Check Console Logs**:
   - Open browser DevTools
   - Look for error messages in Console tab
   - Check Network tab for failed requests

## 🔧 Customization

### Modify Refresh Intervals
Edit `components/monitoring/MonitoringDashboard.jsx`:

```javascript
const [refreshInterval, setRefreshInterval] = useState(30000); // Default 30s
```

### Add Custom Metrics
Extend the monitoring API in `src/app/api/monitoring/route.js`:

```javascript
// Add custom business metrics
data.businessMetrics = {
  activeUsers: await getActiveUserCount(),
  notesCreated: await getTodaysNoteCount(),
  // ... more custom metrics
};
```

### Style Customization
The dashboard uses Tailwind CSS classes. Modify colors and styles in:
- `components/monitoring/MonitoringDashboard.jsx`
- `src/app/admin/layout.js`

## 📚 Related Documentation

- [Monitoring Integration Guide](./MONITORING_INTEGRATION.md) - Complete setup guide
- [API Routes Documentation](./API_ROUTES.md) - All API endpoints
- [Project Summary](./PROJECT_SUMMARY.md) - Complete project overview

## 🎯 Next Steps

1. **Set up the files** as shown above
2. **Start your development server**:
   ```bash
   npm run dev
   ```
3. **Navigate to**: `http://localhost:3000/admin/monitoring`
4. **Customize** authentication and styling as needed 