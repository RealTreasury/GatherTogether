
class ValidationAnalytics {
    constructor() {
        this.events = [];
        this.patterns = new Map();
        this.blockedAttempts = new Map();
        this.cleaningStats = {
            totalAttempts: 0,
            cleanedCount: 0,
            rejectedCount: 0,
            commonViolations: new Map()
        };
        this.performanceMetrics = {
            validationTime: [],
            peakUsageHours: new Map(),
            userRetentionAfterCleaning: 0
        };
        this.antiCheatEvents = [];
        
        // Initialize analytics
        this.init();
    }

    init() {
        // Load persisted analytics data
        this.loadAnalytics();
        
        // Set up periodic data persistence
        setInterval(() => this.saveAnalytics(), 60000); // Save every minute
        
        // Set up performance monitoring
        this.setupPerformanceMonitoring();
        
        console.log('✅ Validation Analytics initialized');
    }

    // Track validation event
    trackValidation(event) {
        const validationEvent = {
            timestamp: new Date().toISOString(),
            type: event.type, // 'attempt', 'cleaned', 'rejected', 'accepted'
            originalUsername: event.originalUsername,
            cleanedUsername: event.cleanedUsername,
            reason: event.reason,
            userId: event.userId,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            sessionId: this.getSessionId(),
            validationTime: event.validationTime || 0
        };

        this.events.push(validationEvent);
        this.updateStats(validationEvent);
        
        // Limit event storage to prevent memory issues
        if (this.events.length > 10000) {
            this.events = this.events.slice(-5000);
        }
    }

    trackAntiCheat(event) {
        const acEvent = Object.assign(
            { timestamp: new Date().toISOString() },
            event || {}
        );
        this.antiCheatEvents.push(acEvent);
        if (this.antiCheatEvents.length > 1000) {
            this.antiCheatEvents = this.antiCheatEvents.slice(-500);
        }
    }

    // Update statistics based on validation event
    updateStats(event) {
        this.cleaningStats.totalAttempts++;
        
        switch (event.type) {
            case 'cleaned':
                this.cleaningStats.cleanedCount++;
                this.trackViolationReason(event.reason);
                this.trackPattern(event.originalUsername, event.reason);
                break;
            case 'rejected':
                this.cleaningStats.rejectedCount++;
                this.trackViolationReason(event.reason);
                break;
            case 'accepted':
                // Track successful validations
                break;
        }

        // Track performance metrics
        if (event.validationTime) {
            this.performanceMetrics.validationTime.push(event.validationTime);
            if (this.performanceMetrics.validationTime.length > 1000) {
                this.performanceMetrics.validationTime = this.performanceMetrics.validationTime.slice(-500);
            }
        }

        // Track peak usage hours
        const hour = new Date().getHours();
        this.performanceMetrics.peakUsageHours.set(
            hour,
            (this.performanceMetrics.peakUsageHours.get(hour) || 0) + 1
        );
    }

    // Track violation reasons
    trackViolationReason(reason) {
        if (!reason) return;
        
        const count = this.cleaningStats.commonViolations.get(reason) || 0;
        this.cleaningStats.commonViolations.set(reason, count + 1);
    }

    // Track patterns in blocked usernames
    trackPattern(username, reason) {
        if (!username) return;
        
        const normalized = this.normalizeForPattern(username);
        const patternKey = `${normalized}:${reason}`;
        
        const count = this.patterns.get(patternKey) || 0;
        this.patterns.set(patternKey, count + 1);
    }

    // Normalize username for pattern analysis
    normalizeForPattern(username) {
        return username.toLowerCase()
            .replace(/[0-9]/g, '#')
            .replace(/[^a-z#]/g, '')
            .substring(0, 10);
    }

    // Get current session ID
    getSessionId() {
        if (!this.sessionId) {
            this.sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
        }
        return this.sessionId;
    }

    // Generate analytics report
    generateReport() {
        const report = {
            summary: this.getSummaryStats(),
            violations: this.getViolationAnalysis(),
            patterns: this.getPatternAnalysis(),
            performance: this.getPerformanceAnalysis(),
            antiCheat: this.antiCheatEvents.slice(-100),
            recommendations: this.getRecommendations()
        };

        return report;
    }

    // Get summary statistics
    getSummaryStats() {
        const total = this.cleaningStats.totalAttempts;
        const cleaned = this.cleaningStats.cleanedCount;
        const rejected = this.cleaningStats.rejectedCount;
        const accepted = total - cleaned - rejected;

        return {
            totalAttempts: total,
            cleanedCount: cleaned,
            rejectedCount: rejected,
            acceptedCount: accepted,
            cleaningRate: total > 0 ? (cleaned / total * 100).toFixed(1) : 0,
            rejectionRate: total > 0 ? (rejected / total * 100).toFixed(1) : 0,
            acceptanceRate: total > 0 ? (accepted / total * 100).toFixed(1) : 0,
            timeRange: this.getTimeRange()
        };
    }

    // Get violation analysis
    getViolationAnalysis() {
        const sortedViolations = Array.from(this.cleaningStats.commonViolations.entries())
            .sort((a, b) => b[1] - a[1]);

        return {
            topViolations: sortedViolations.slice(0, 10),
            violationCategories: this.categorizeViolations(sortedViolations),
            recentTrends: this.getRecentViolationTrends()
        };
    }

    // Categorize violations
    categorizeViolations(violations) {
        const categories = {
            profanity: 0,
            inappropriate: 0,
            patterns: 0,
            length: 0,
            other: 0
        };

        violations.forEach(([reason, count]) => {
            const lower = reason.toLowerCase();
            if (lower.includes('profanity') || lower.includes('inappropriate word')) {
                categories.profanity += count;
            } else if (lower.includes('inappropriate') || lower.includes('hate')) {
                categories.inappropriate += count;
            } else if (lower.includes('pattern') || lower.includes('test') || lower.includes('number')) {
                categories.patterns += count;
            } else if (lower.includes('length') || lower.includes('short') || lower.includes('long')) {
                categories.length += count;
            } else {
                categories.other += count;
            }
        });

        return categories;
    }

    // Get pattern analysis
    getPatternAnalysis() {
        const sortedPatterns = Array.from(this.patterns.entries())
            .sort((a, b) => b[1] - a[1]);

        return {
            topPatterns: sortedPatterns.slice(0, 20),
            patternTrends: this.getPatternTrends(),
            evasionAttempts: this.detectEvasionAttempts()
        };
    }

    // Detect evasion attempts
    detectEvasionAttempts() {
        const evasionPatterns = [];
        
        // Look for l33t speak patterns
        const leetPatterns = this.events
            .filter(e => e.type === 'cleaned' && this.containsLeetSpeak(e.originalUsername))
            .map(e => ({ username: e.originalUsername, pattern: 'l33t_speak' }));
        
        // Look for spacing/punctuation evasion
        const spacingPatterns = this.events
            .filter(e => e.type === 'cleaned' && this.containsSpacingEvasion(e.originalUsername))
            .map(e => ({ username: e.originalUsername, pattern: 'spacing_evasion' }));

        return [...leetPatterns, ...spacingPatterns];
    }

    // Check for l33t speak
    containsLeetSpeak(username) {
        const leetChars = ['4', '3', '1', '0', '5', '7', '@', '$', '!'];
        return leetChars.some(char => username.includes(char));
    }

    // Check for spacing evasion
    containsSpacingEvasion(username) {
        return /[a-z][^a-z0-9][a-z]/i.test(username);
    }

    // Get performance analysis
    getPerformanceAnalysis() {
        const validationTimes = this.performanceMetrics.validationTime;
        
        return {
            averageValidationTime: validationTimes.length > 0 ? 
                (validationTimes.reduce((a, b) => a + b, 0) / validationTimes.length).toFixed(2) : 0,
            peakUsageHours: this.getPeakUsageHours(),
            validationLoad: this.getValidationLoad(),
            systemHealth: this.getSystemHealth()
        };
    }

    // Get peak usage hours
    getPeakUsageHours() {
        const sortedHours = Array.from(this.performanceMetrics.peakUsageHours.entries())
            .sort((a, b) => b[1] - a[1]);
        
        return sortedHours.slice(0, 5);
    }

    // Get validation load analysis
    getValidationLoad() {
        const recentEvents = this.events.filter(e => 
            Date.now() - new Date(e.timestamp).getTime() < 3600000 // Last hour
        );

        return {
            lastHour: recentEvents.length,
            averagePerHour: this.events.length > 0 ? 
                (this.events.length / Math.max(1, this.getHoursSinceFirstEvent())).toFixed(1) : 0,
            trend: this.getLoadTrend()
        };
    }

    // Get system health indicators
    getSystemHealth() {
        const recentFailures = this.events.filter(e => 
            e.type === 'error' && Date.now() - new Date(e.timestamp).getTime() < 3600000
        );

        return {
            status: recentFailures.length === 0 ? 'healthy' : 'degraded',
            uptime: this.getUptime(),
            errorRate: this.getErrorRate(),
            lastError: recentFailures.length > 0 ? recentFailures[0].timestamp : null
        };
    }

    // Generate recommendations
    getRecommendations() {
        const recommendations = [];
        const stats = this.getSummaryStats();
        const violations = this.getViolationAnalysis();

        // High cleaning rate recommendation
        if (parseFloat(stats.cleaningRate) > 20) {
            recommendations.push({
                type: 'high_cleaning_rate',
                priority: 'medium',
                message: `Cleaning rate is ${stats.cleaningRate}%. Consider reviewing blocked words list for false positives.`,
                action: 'review_blocked_words'
            });
        }

        // High rejection rate recommendation
        if (parseFloat(stats.rejectionRate) > 10) {
            recommendations.push({
                type: 'high_rejection_rate',
                priority: 'high',
                message: `Rejection rate is ${stats.rejectionRate}%. Users may be frustrated. Consider providing better guidance.`,
                action: 'improve_user_guidance'
            });
        }

        // Top violation pattern recommendation
        if (violations.topViolations.length > 0) {
            const topViolation = violations.topViolations[0];
            recommendations.push({
                type: 'top_violation_pattern',
                priority: 'medium',
                message: `Most common violation: ${topViolation[0]} (${topViolation[1]} occurrences). Consider targeted prevention.`,
                action: 'address_top_violation'
            });
        }

        // Performance recommendation
        const avgTime = parseFloat(this.getPerformanceAnalysis().averageValidationTime);
        if (avgTime > 100) {
            recommendations.push({
                type: 'performance',
                priority: 'low',
                message: `Average validation time is ${avgTime}ms. Consider optimizing validation logic.`,
                action: 'optimize_validation'
            });
        }

        return recommendations;
    }

    // Helper methods
    getTimeRange() {
        if (this.events.length === 0) return null;
        
        const timestamps = this.events.map(e => new Date(e.timestamp).getTime());
        const earliest = Math.min(...timestamps);
        const latest = Math.max(...timestamps);
        
        return {
            start: new Date(earliest).toISOString(),
            end: new Date(latest).toISOString(),
            duration: ((latest - earliest) / 1000 / 60 / 60).toFixed(1) + ' hours'
        };
    }

    getHoursSinceFirstEvent() {
        if (this.events.length === 0) return 1;
        
        const firstEvent = new Date(this.events[0].timestamp);
        const now = new Date();
        return Math.max(1, (now - firstEvent) / 1000 / 60 / 60);
    }

    getRecentViolationTrends() {
        const recentEvents = this.events.filter(e => 
            Date.now() - new Date(e.timestamp).getTime() < 86400000 // Last 24 hours
        );

        const hourlyTrends = new Map();
        recentEvents.forEach(event => {
            const hour = new Date(event.timestamp).getHours();
            if (!hourlyTrends.has(hour)) {
                hourlyTrends.set(hour, { cleaned: 0, rejected: 0 });
            }
            
            const hourData = hourlyTrends.get(hour);
            if (event.type === 'cleaned') hourData.cleaned++;
            if (event.type === 'rejected') hourData.rejected++;
        });

        return Array.from(hourlyTrends.entries())
            .sort((a, b) => a[0] - b[0]);
    }

    getPatternTrends() {
        const last7Days = this.events.filter(e => 
            Date.now() - new Date(e.timestamp).getTime() < 604800000 // 7 days
        );

        const dailyPatterns = new Map();
        last7Days.forEach(event => {
            const day = new Date(event.timestamp).toDateString();
            if (!dailyPatterns.has(day)) {
                dailyPatterns.set(day, new Map());
            }
            
            if (event.originalUsername && event.reason) {
                const pattern = this.normalizeForPattern(event.originalUsername);
                const dayData = dailyPatterns.get(day);
                dayData.set(pattern, (dayData.get(pattern) || 0) + 1);
            }
        });

        return Array.from(dailyPatterns.entries());
    }

    getLoadTrend() {
        const last24Hours = this.events.filter(e => 
            Date.now() - new Date(e.timestamp).getTime() < 86400000
        );

        const last6Hours = this.events.filter(e => 
            Date.now() - new Date(e.timestamp).getTime() < 21600000
        );

        const recent24h = last24Hours.length;
        const recent6h = last6Hours.length;
        const projected24h = recent6h * 4;

        if (projected24h > recent24h * 1.2) {
            return 'increasing';
        } else if (projected24h < recent24h * 0.8) {
            return 'decreasing';
        } else {
            return 'stable';
        }
    }

    getUptime() {
        // Calculate uptime based on first event
        if (this.events.length === 0) return '0 hours';
        
        const firstEvent = new Date(this.events[0].timestamp);
        const now = new Date();
        const hours = Math.floor((now - firstEvent) / 1000 / 60 / 60);
        
        if (hours < 24) {
            return `${hours} hours`;
        } else {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            return `${days} days, ${remainingHours} hours`;
        }
    }

    getErrorRate() {
        const errors = this.events.filter(e => e.type === 'error');
        const total = this.events.length;
        return total > 0 ? (errors.length / total * 100).toFixed(2) : 0;
    }

    // Setup performance monitoring
    setupPerformanceMonitoring() {
        // Monitor validation performance
        const originalValidate = window.UsernameValidator?.validateWithFeedback;
        if (originalValidate) {
            window.UsernameValidator.validateWithFeedback = (username) => {
                const startTime = performance.now();
                const result = originalValidate.call(window.UsernameValidator, username);
                const endTime = performance.now();
                
                // Track performance
                this.trackValidation({
                    type: result.isValid ? 'accepted' : 'cleaned',
                    originalUsername: username,
                    cleanedUsername: result.cleanUsername,
                    reason: result.message,
                    validationTime: endTime - startTime,
                    userId: window.Utils?.getUserId()
                });
                
                return result;
            };
        }
    }

    // Data persistence
    saveAnalytics() {
        try {
            const analyticsData = {
                events: this.events.slice(-1000), // Keep last 1000 events
                patterns: Array.from(this.patterns.entries()),
                cleaningStats: {
                    ...this.cleaningStats,
                    commonViolations: Array.from(this.cleaningStats.commonViolations.entries())
                },
                performanceMetrics: {
                    ...this.performanceMetrics,
                    validationTime: this.performanceMetrics.validationTime.slice(-100),
                    peakUsageHours: Array.from(this.performanceMetrics.peakUsageHours.entries())
                }
            };
            
            localStorage.setItem('validation_analytics', JSON.stringify(analyticsData));
        } catch (error) {
            console.warn('Failed to save analytics data:', error);
        }
    }

    loadAnalytics() {
        try {
            const saved = localStorage.getItem('validation_analytics');
            if (saved) {
                const data = JSON.parse(saved);
                
                this.events = data.events || [];
                this.patterns = new Map(data.patterns || []);
                this.antiCheatEvents = data.antiCheatEvents || [];

                
                if (data.cleaningStats) {

                    this.cleaningStats = {
                        ...data.cleaningStats,
                        commonViolations: new Map(data.cleaningStats.commonViolations || [])
                    };
                }
                
                if (data.performanceMetrics) {
                    this.performanceMetrics = {
                        ...data.performanceMetrics,
                        peakUsageHours: new Map(data.performanceMetrics.peakUsageHours || [])
                    };
                }
            }
        } catch (error) {
            console.warn('Failed to load analytics data:', error);
        }
    }

    // Export data for external analysis
    exportData() {
        const report = this.generateReport();
        const exportData = {
            timestamp: new Date().toISOString(),
            report: report,
            rawEvents: this.events,
            antiCheatEvents: this.antiCheatEvents,
            version: '1.0.1'
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `validation_analytics_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    // Clear all analytics data
    clearData() {
        this.events = [];
        this.patterns.clear();
        this.cleaningStats = {
            totalAttempts: 0,
            cleanedCount: 0,
            rejectedCount: 0,
            commonViolations: new Map()
        };
        this.performanceMetrics = {
            validationTime: [],
            peakUsageHours: new Map(),
            userRetentionAfterCleaning: 0
        };
        
        localStorage.removeItem('validation_analytics');
        console.log('Analytics data cleared');
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.ValidationAnalytics = new ValidationAnalytics();
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationAnalytics;
}

// Track validation events
// ValidationAnalytics.trackValidation({
//     type: 'cleaned',
//     originalUsername: 'inappropriate123',
//     cleanedUsername: 'GatheringFriend456',
//     reason: 'Contains inappropriate content',
//     userId: 'user123'
// });

// Generate reports
// const report = ValidationAnalytics.generateReport();
