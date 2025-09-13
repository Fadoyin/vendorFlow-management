# Monitoring & Observability Guide

## Overview
This guide covers monitoring, logging, alerting, and observability for the Vendor Management Platform.

## Architecture

### Monitoring Stack
- **CloudWatch**: AWS native monitoring
- **Grafana**: Custom dashboards (optional)
- **Prometheus**: Metrics collection (optional)
- **Jaeger**: Distributed tracing (optional)

### Key Metrics
- **Application**: Response time, error rate, throughput
- **Infrastructure**: CPU, memory, disk, network
- **Business**: User activity, transaction volume

## CloudWatch Implementation

### Dashboards
```bash
# Main dashboard
aws cloudwatch get-dashboard --dashboard-name "vendor-management-main"

# Service-specific dashboards
aws cloudwatch get-dashboard --dashboard-name "vendor-management-backend"
aws cloudwatch get-dashboard --dashboard-name "vendor-management-ml"
```

### Alarms
```bash
# List alarms
aws cloudwatch describe-alarms --alarm-names-prefix "vendor-management"

# Test alarm
aws cloudwatch set-alarm-state --alarm-name "vendor-management-high-cpu" --state-value ALARM
```

### Log Groups
```bash
# Backend logs
aws logs describe-log-groups --log-group-name-prefix "/aws/ecs/vendor-management-backend"

# ML service logs
aws logs describe-log-groups --log-group-name-prefix "/aws/ecs/vendor-management-ml"
```

## Application Monitoring

### Health Checks
```typescript
// Backend health endpoint
GET /health
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "aws": "healthy"
  }
}

// ML service health
GET /health
{
  "status": "healthy",
  "models": {
    "demand_forecast": "loaded",
    "cost_prediction": "loaded"
  }
}
```

### Custom Metrics
```typescript
// Track business metrics
@Injectable()
export class MetricsService {
  async trackVendorCreation(tenantId: string) {
    await this.cloudWatch.putMetricData({
      Namespace: 'VendorManagement',
      MetricData: [{
        MetricName: 'VendorsCreated',
        Value: 1,
        Unit: 'Count',
        Dimensions: [{ Name: 'TenantId', Value: tenantId }]
      }]
    }).promise();
  }
}
```

## Logging Strategy

### Structured Logging
```typescript
// Backend logging
@Injectable()
export class LoggingService {
  log(level: string, message: string, context: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      tenantId: context.tenantId,
      userId: context.userId,
      requestId: context.requestId,
      service: 'backend'
    };
    
    console.log(JSON.stringify(logEntry));
  }
}
```

### Log Levels
- **ERROR**: Application errors, exceptions
- **WARN**: Warning conditions, degraded performance
- **INFO**: General information, business events
- **DEBUG**: Detailed debugging information

### Log Rotation
```yaml
# CloudWatch log configuration
logConfiguration:
  logDriver: awslogs
  options:
    awslogs-group: /aws/ecs/vendor-management-backend
    awslogs-region: us-east-1
    awslogs-stream-prefix: ecs
    awslogs-create-group: true
```

## Performance Monitoring

### Response Time Tracking
```typescript
// Track API response times
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.metricsService.trackResponseTime(
          request.route.path,
          duration,
          request.tenantId
        );
      })
    );
  }
}
```

### Database Performance
```typescript
// Monitor database queries
@Injectable()
export class DatabaseService {
  async executeQuery(query: string, params: any[]) {
    const start = Date.now();
    
    try {
      const result = await this.connection.execute(query, params);
      const duration = Date.now() - start;
      
      // Track slow queries
      if (duration > 1000) {
        this.logger.warn('Slow query detected', { query, duration, params });
      }
      
      return result;
    } catch (error) {
      this.metricsService.trackDatabaseError(query, error);
      throw error;
    }
  }
}
```

## Alerting

### Critical Alerts
- **Service Down**: Immediate notification
- **High Error Rate**: >5% errors in 5 minutes
- **High Response Time**: >2 seconds average
- **Database Issues**: Connection failures, slow queries

### Warning Alerts
- **High CPU/Memory**: >80% utilization
- **Low Disk Space**: <20% remaining
- **High Latency**: >1 second average

### Alert Channels
```yaml
# SNS topics for different alert levels
alerts:
  critical:
    topic: vendor-management-critical-alerts
    channels: [slack, email, pagerduty]
  warning:
    topic: vendor-management-warning-alerts
    channels: [slack, email]
  info:
    topic: vendor-management-info-alerts
    channels: [slack]
```

## Business Intelligence

### Key Performance Indicators
- **User Engagement**: Daily active users, session duration
- **Business Operations**: Orders processed, inventory turnover
- **Vendor Performance**: On-time delivery, quality ratings
- **Financial**: Cost savings, budget utilization

### Custom Dashboards
```typescript
// Generate business metrics
@Injectable()
export class BusinessMetricsService {
  async generateVendorMetrics(tenantId: string) {
    const metrics = await this.vendorService.getPerformanceMetrics(tenantId);
    
    return {
      totalVendors: metrics.length,
      averageRating: this.calculateAverage(metrics, 'rating'),
      onTimeDelivery: this.calculatePercentage(metrics, 'onTimeDelivery'),
      topPerformers: this.getTopPerformers(metrics, 5)
    };
  }
}
```

## Troubleshooting

### Common Issues
1. **High Response Times**
   - Check database performance
   - Review external API calls
   - Analyze query patterns

2. **Memory Leaks**
   - Monitor memory usage over time
   - Check for unclosed connections
   - Review object lifecycle

3. **Database Bottlenecks**
   - Analyze slow query logs
   - Check index usage
   - Monitor connection pool

### Debug Commands
```bash
# Check service status
docker ps --filter "name=vendor-management"

# View logs
docker logs vendor-management-backend
docker logs vendor-management-ml

# Check resource usage
docker stats vendor-management-backend
```

## Best Practices

### Monitoring
- Set appropriate thresholds for alerts
- Use multiple alert channels
- Implement alert fatigue prevention
- Regular review of alert effectiveness

### Logging
- Log structured data, not just strings
- Include correlation IDs for tracing
- Avoid logging sensitive information
- Implement log retention policies

### Performance
- Monitor business metrics, not just technical ones
- Set up automated performance testing
- Track trends over time
- Alert on anomalies, not just thresholds

## Next Steps
1. Implement custom business metrics
2. Set up Grafana dashboards
3. Add distributed tracing
4. Implement automated performance testing
5. Create runbooks for common issues
