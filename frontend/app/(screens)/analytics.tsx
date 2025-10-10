// screens/AnalyticsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Text, Title, Card, SegmentedButtons, ActivityIndicator, Button } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useMood } from '../../context/MoodContext';
import { RootStackParamList, MoodAnalytics } from '../../types';

type AnalyticsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Analytics'>;

interface Props {
  navigation: AnalyticsScreenNavigationProp;
}

type ChartType = 'line' | 'bar' | 'pie';
type TimeRange = 'week' | 'month' | '3months';

const { width } = Dimensions.get('window');

const AnalyticsScreen: React.FC<Props> = ({ navigation }) => {
  const { analytics, fetchAnalytics, loading } = useMood();
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setError(null);
      setRefreshing(true);
      console.log('🔄 Loading analytics...');
      await fetchAnalytics();
      console.log('📊 Analytics loaded:', analytics);
    } catch (err) {
      console.error('❌ Error loading analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setRefreshing(false);
    }
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#2196F3',
    },
  };

  const getMoodDistributionData = () => {
    if (!analytics?.distribution || Object.keys(analytics.distribution).length === 0) {
      console.log('📊 No distribution data available');
      return [
        {
          name: 'No Data',
          population: 1,
          color: '#CCCCCC',
          legendFontColor: '#7F7F7F',
          legendFontSize: 12,
        }
      ];
    }

    console.log('📊 Distribution data:', analytics.distribution);

    const emojiLabels: Record<string, string> = {
      '😊': 'Happy',
      '😄': 'Great',
      '😐': 'Neutral',
      '😔': 'Down',
      '😢': 'Sad',
      '😡': 'Angry',
      '😴': 'Tired',
      '😰': 'Anxious',
    };

    const data = Object.entries(analytics.distribution).map(([emoji, count]) => ({
      name: emojiLabels[emoji] || emoji,
      population: count,
      color: getMoodColor(emoji),
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));

    console.log('📊 Pie chart data:', data);
    return data;
  };

  const getMoodColor = (emoji: string): string => {
    const colors: Record<string, string> = {
      '😊': '#4CAF50', // Happy - Green
      '😄': '#2E7D32', // Great - Dark Green
      '😐': '#FFC107', // Neutral - Yellow
      '😔': '#FF9800', // Down - Orange
      '😢': '#F44336', // Sad - Red
      '😡': '#B71C1C', // Angry - Dark Red
      '😴': '#9C27B0', // Tired - Purple
      '😰': '#673AB7', // Anxious - Deep Purple
    };
    return colors[emoji] || '#666666';
  };

  const getWeeklyAverageData = () => {
    if (!analytics?.weeklyAverages || analytics.weeklyAverages.length === 0) {
      console.log('📊 No weekly averages data available');
      return { 
        labels: ['No Data'], 
        datasets: [{ data: [0] }] 
      };
    }

    console.log('📊 Weekly averages:', analytics.weeklyAverages);

    const labels = analytics.weeklyAverages.map(item => {
      const weekNumber = item.week.split('-W')[1];
      return `W${weekNumber}`;
    });

    const data = analytics.weeklyAverages.map(item => item.average);

    const chartData = {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    console.log('📊 Line/Bar chart data:', chartData);
    return chartData;
  };

  // Debug information
  console.log('🔍 Analytics state:', {
    analytics,
    loading: loading || refreshing,
    error,
    hasData: !!analytics,
    totalMoods: analytics?.totalMoods,
    averageMood: analytics?.averageMood,
    distribution: analytics?.distribution,
    weeklyAverages: analytics?.weeklyAverages,
  });

  if (loading || refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadAnalytics} style={styles.retryButton}>
          Try Again
        </Button>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No analytics data available yet. Start tracking your moods to see insights!
        </Text>
        <Button mode="contained" onPress={loadAnalytics} style={styles.retryButton}>
          Load Analytics
        </Button>
      </View>
    );
  }

  // Check if we have meaningful data
  const hasMeaningfulData = analytics.totalMoods > 0;

  if (!hasMeaningfulData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          You need to track at least one mood to see analytics!
        </Text>
        <Text style={styles.emptySubtext}>
          Go to the Mood Tracker and log your first mood.
        </Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate('MoodTracker')}
          style={styles.retryButton}
        >
          Track Mood
        </Button>
      </View>
    );
  }

  const hasChartData = analytics.weeklyAverages && analytics.weeklyAverages.length > 0;
  const hasDistributionData = analytics.distribution && Object.keys(analytics.distribution).length > 0;

  return (
    <ScrollView style={styles.container} refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={loadAnalytics} />
    }>
      <View style={styles.content}>
        <Title style={styles.title}>Mood Analytics</Title>

        {/* Debug Info - Remove in production */}
        {/* <Card style={styles.debugCard}>
          <Card.Content>
            <Text style={styles.debugText}>
              Debug: {analytics.totalMoods} moods | Avg: {analytics.averageMood?.toFixed(1) || '0.0'}
            </Text>
            <Text style={styles.debugSubtext}>
              Distribution: {JSON.stringify(analytics.distribution)}
            </Text>
          </Card.Content>
        </Card> */}

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <Text style={styles.summaryNumber}>{analytics.totalMoods}</Text>
              <Text style={styles.summaryLabel}>Total Moods</Text>
            </Card.Content>
          </Card>
          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <Text style={styles.summaryNumber}>
                {analytics.averageMood?.toFixed(1) || '0.0'}
              </Text>
              <Text style={styles.summaryLabel}>Avg Mood</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Chart Type Selector */}
        <Card style={styles.selectorCard}>
          <Card.Content>
            <Text style={styles.selectorLabel}>Chart Type</Text>
            <SegmentedButtons
              value={chartType}
              onValueChange={(value) => setChartType(value as ChartType)}
              buttons={[
                { value: 'line', label: 'Trend' },
                { value: 'bar', label: 'Bars' },
                { value: 'pie', label: 'Distribution' },
              ]}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* Charts */}
        {chartType === 'line' && (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Title style={styles.chartTitle}>Mood Trend</Title>
              {hasChartData ? (
                <LineChart
                  data={getWeeklyAverageData()}
                  width={width - 48}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                  fromZero
                  yAxisSuffix=""
                  yAxisInterval={1}
                />
              ) : (
                <View style={styles.emptyChart}>
                  <Text style={styles.emptyChartText}>
                    No trend data available yet
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {chartType === 'bar' && (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Title style={styles.chartTitle}>Mood Scores</Title>
              {hasChartData ? (
                <BarChart
                  data={getWeeklyAverageData()}
                  width={width - 48}
                  height={220}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  showValuesOnTopOfBars
                  fromZero
                  yAxisSuffix=""
                  yAxisLabel=""
                />
              ) : (
                <View style={styles.emptyChart}>
                  <Text style={styles.emptyChartText}>
                    No bar chart data available yet
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {chartType === 'pie' && (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Title style={styles.chartTitle}>Mood Distribution</Title>
              {hasDistributionData ? (
                <PieChart
                  data={getMoodDistributionData()}
                  width={width - 48}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              ) : (
                <View style={styles.emptyChart}>
                  <Text style={styles.emptyChartText}>
                    No mood distribution data available yet
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Insights */}
        <Card style={styles.insightsCard}>
          <Card.Content>
            <Title style={styles.insightsTitle}>Insights</Title>
            <View style={styles.insightItem}>
              <Text style={styles.insightText}>
                • Your average mood is {analytics.averageMood?.toFixed(1) || '0.0'}/10
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightText}>
                • You've tracked {analytics.totalMoods} moods in total
              </Text>
            </View>
            {hasDistributionData && (
              <View style={styles.insightItem}>
                <Text style={styles.insightText}>
                  • Most common mood: {Object.entries(analytics.distribution).reduce((a, b) => a[1] > b[1] ? a : b)[0]}
                </Text>
              </View>
            )}
            {hasChartData && analytics.weeklyAverages.length > 1 && (
              <View style={styles.insightItem}>
                <Text style={styles.insightText}>
                  • Your mood trend is{' '}
                  {analytics.weeklyAverages[analytics.weeklyAverages.length - 1].average >
                  analytics.weeklyAverages[0].average
                    ? 'improving 📈'
                    : analytics.weeklyAverages[analytics.weeklyAverages.length - 1].average <
                      analytics.weeklyAverages[0].average
                    ? 'declining 📉'
                    : 'stable 📊'}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Refresh Button */}
        <Button 
          mode="outlined" 
          onPress={loadAnalytics} 
          style={styles.refreshButton}
          icon="refresh"
        >
          Refresh Data
        </Button>
      </View>
    </ScrollView>
  );
};

// Add RefreshControl import
import { RefreshControl } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#F44336',
    marginBottom: 20,
  },
  retryButton: {
    borderRadius: 20,
  },
  refreshButton: {
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    width: '48%',
    elevation: 4,
  },
  summaryContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  selectorCard: {
    marginBottom: 16,
    elevation: 2,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666',
  },
  segmentedButtons: {
    marginHorizontal: -4,
  },
  chartCard: {
    marginBottom: 16,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyChart: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  insightsCard: {
    marginBottom: 20,
    elevation: 2,
  },
  insightsTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  insightItem: {
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  debugCard: {
    marginBottom: 16,
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
  debugSubtext: {
    fontSize: 10,
    color: '#856404',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default AnalyticsScreen;