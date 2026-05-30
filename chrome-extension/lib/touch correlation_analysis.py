import seaborn as sns
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
touch correlation_analysis.py
echo "#!/usr/bin/env python3" > correlation_analysis.py
echo "import pandas as pd" >> correlation_analysis.py
echo "import seaborn as sns" >> correlation_analysis.py
echo "import matplotlib.pyplot as plt" >> correlation_analysis.py
echo "" >> correlation_analysis.py
echo "def main():" >> correlation_analysis.py
#!/usr/bin/env python3
"""
3-Asset Correlation Analysis in Python
Calculate correlation between NQ, Gold, and 10Y Yield
"""


# ============================================================================
# PART 1: Simple Correlation (Using Sample Data)
# ============================================================================

print("=" * 80)
print("PART 1: SIMPLE 3-ASSET CORRELATION CALCULATION")
print("=" * 80)

# Create sample data for the past 10 days
dates = pd.date_range(start='2024-05-13', periods=10, freq='D')

# Sample prices (from your actual data)
data = {
    'Date': dates,
    'NQ': [29370, 29320, 29064, 29234, 28563, 28599, 28425, 28480, 28706, 29340],
    'Gold': [4700.41, 4735.27, 4717.73, 4714.89, 4686.81, 4690.25, 4557.23, 4586.79, 4686.81, 4717.31],
    '10Y_Yield': [4.20, 4.18, 4.22, 4.19, 4.25, 4.23, 4.17, 4.21, 4.24, 4.20]
}

# Create DataFrame
df = pd.DataFrame(data)

print("\n1. Sample Data:")
print(df)

# ============================================================================
# METHOD 1: Calculate Pairwise Correlations (Simple)
# ============================================================================

print("\n" + "=" * 80)
print("METHOD 1: CALCULATE PAIRWISE CORRELATIONS")
print("=" * 80)

# Correlation between NQ and Gold
nq_gold_corr = df['NQ'].corr(df['Gold'])
print(f"\nNQ vs Gold Correlation: {nq_gold_corr:.4f}")

# Correlation between NQ and 10Y Yield
nq_yield_corr = df['NQ'].corr(df['10Y_Yield'])
print(f"NQ vs 10Y Yield Correlation: {nq_yield_corr:.4f}")

# Correlation between Gold and 10Y Yield
gold_yield_corr = df['Gold'].corr(df['10Y_Yield'])
print(f"Gold vs 10Y Yield Correlation: {gold_yield_corr:.4f}")

# ============================================================================
# METHOD 2: Create Correlation Matrix (Professional)
# ============================================================================

print("\n" + "=" * 80)
print("METHOD 2: CORRELATION MATRIX (3x3)")
print("=" * 80)

# Select only the numeric columns we want
prices = df[['NQ', 'Gold', '10Y_Yield']]

# Calculate correlation matrix
correlation_matrix = prices.corr()

print("\nFull Correlation Matrix:")
print(correlation_matrix)

print("\nFormatted Correlation Matrix:")
print(correlation_matrix.round(4))

# ============================================================================
# METHOD 3: Visualize the Correlation Matrix
# ============================================================================

print("\n" + "=" * 80)
print("METHOD 3: VISUALIZE CORRELATION (Heatmap)")
print("=" * 80)


# Create a heatmap
plt.figure(figsize=(8, 6))
sns.heatmap(correlation_matrix,
            annot=True,           # Show values
            cmap='RdYlGn',        # Red (negative) to Green (positive)
            center=0,             # Center on 0
            vmin=-1, vmax=1,      # Range from -1 to 1
            square=True,
            cbar_kws={'label': 'Correlation'})
plt.title('3-Asset Correlation Matrix\n(NQ, Gold, 10Y Yield)')
plt.tight_layout()
plt.savefig('correlation_heatmap.png')
print("\n✓ Heatmap saved as 'correlation_heatmap.png'")
plt.show()

# ============================================================================
# PART 2: Calculate Daily Returns and Rolling Correlation
# ============================================================================

print("\n" + "=" * 80)
print("PART 2: DAILY RETURNS & ROLLING CORRELATION")
print("=" * 80)

# Calculate daily percentage changes
df['NQ_Return'] = df['NQ'].pct_change() * 100       # As percentage
df['Gold_Return'] = df['Gold'].pct_change() * 100
# Yield is already percentage
df['Yield_Return'] = df['10Y_Yield'].diff()

print("\n1. Daily Returns (%):")
print(df[['Date', 'NQ_Return', 'Gold_Return', 'Yield_Return']].round(4))

# Calculate rolling 5-day correlation
rolling_window = 5

rolling_corr_nq_gold = df['NQ'].rolling(window=rolling_window).corr(df['Gold'])
rolling_corr_nq_yield = df['NQ'].rolling(
    window=rolling_window).corr(df['10Y_Yield'])
rolling_corr_gold_yield = df['Gold'].rolling(
    window=rolling_window).corr(df['10Y_Yield'])

df['NQ_Gold_Corr'] = rolling_corr_nq_gold
df['NQ_Yield_Corr'] = rolling_corr_nq_yield
df['Gold_Yield_Corr'] = rolling_corr_gold_yield

print(f"\n2. Rolling {rolling_window}-Day Correlation:")
print(df[['Date', 'NQ_Gold_Corr', 'NQ_Yield_Corr', 'Gold_Yield_Corr']].round(4))

# ============================================================================
# PART 3: Fetch Real Data from API (Yahoo Finance)
# ============================================================================

print("\n" + "=" * 80)
print("PART 3: FETCH REAL DATA FROM YAHOO FINANCE")
print("=" * 80)

print("\nInstalling yfinance...")
print("pip install yfinance")
print("\nOr import it like this:")

# Note: This requires: pip install yfinance
try:
    import yfinance as yf

    print("\n✓ yfinance imported successfully!")

    # Fetch real data for the past 30 days
    print("\nFetching real data for past 30 days...")

    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)

    # Fetch NQ (Nasdaq-100 Futures) - using QQQ as proxy
    print("  - Fetching QQQ (Nasdaq proxy)...")
    qqq = yf.download('QQQ', start=start_date,
                      end=end_date, progress=False)['Close']

    # Fetch Gold
    print("  - Fetching Gold (GLD ETF)...")
    gold = yf.download('GLD', start=start_date,
                       end=end_date, progress=False)['Close']

    # Fetch 10Y Yield (TLT ETF as proxy, or use direct API)
    print("  - Fetching TLT (10Y Treasury proxy)...")
    tlt = yf.download('TLT', start=start_date,
                      end=end_date, progress=False)['Close']

    # Create DataFrame with real data
    real_data = pd.DataFrame({
        'QQQ': qqq,
        'Gold': gold,
        '10Y': tlt
    })

    print("\n✓ Real Data Retrieved!")
    print(f"\nData Range: {start_date.date()} to {end_date.date()}")
    print(f"Rows: {len(real_data)}")
    print("\nFirst 5 rows:")
    print(real_data.head())

    # Calculate correlation on real data
    real_correlation = real_data.corr()

    print("\nReal Data Correlation Matrix:")
    print(real_correlation.round(4))

except ImportError:
    print("\n⚠ yfinance not installed. Skipping real data example.")
    print("To use real data, install: pip install yfinance")

# ============================================================================
# PART 4: Complete Trading System Class
# ============================================================================

print("\n" + "=" * 80)
print("PART 4: COMPLETE CORRELATION SYSTEM CLASS")
print("=" * 80)


class CorrelationAnalyzer:
    """
    Complete system for analyzing 3-asset correlations
    """

    def __init__(self, name='Correlation Analyzer'):
        self.name = name
        self.data = None
        self.correlation_matrix = None
        self.rolling_correlations = {}

    def add_data(self, dates, nq_prices, gold_prices, yield_data):
        """
        Add price data for analysis

        Args:
            dates: list of dates
            nq_prices: list of NQ prices
            gold_prices: list of Gold prices
            yield_data: list of 10Y yield percentages
        """
        self.data = pd.DataFrame({
            'Date': dates,
            'NQ': nq_prices,
            'Gold': gold_prices,
            '10Y_Yield': yield_data
        })
        print(f"✓ Added {len(self.data)} rows of data")

    def calculate_correlation_matrix(self):
        """Calculate full correlation matrix"""
        prices = self.data[['NQ', 'Gold', '10Y_Yield']]
        self.correlation_matrix = prices.corr()
        return self.correlation_matrix

    def calculate_rolling_correlation(self, window=5):
        """
        Calculate rolling correlation over time

        Args:
            window: number of days for rolling window

        Returns:
            DataFrame with rolling correlations
        """
        df = self.data.copy()

        df['NQ_Gold_Corr'] = df['NQ'].rolling(window=window).corr(df['Gold'])
        df['NQ_Yield_Corr'] = df['NQ'].rolling(
            window=window).corr(df['10Y_Yield'])
        df['Gold_Yield_Corr'] = df['Gold'].rolling(
            window=window).corr(df['10Y_Yield'])

        self.rolling_correlations = df[[
            'Date', 'NQ_Gold_Corr', 'NQ_Yield_Corr', 'Gold_Yield_Corr']]
        return self.rolling_correlations

    def get_correlation_interpretation(self):
        """
        Provide trading interpretation of correlations
        """
        if self.correlation_matrix is None:
            return "No correlation matrix calculated yet"

        nq_gold = self.correlation_matrix.loc['NQ', 'Gold']
        nq_yield = self.correlation_matrix.loc['NQ', '10Y_Yield']
        gold_yield = self.correlation_matrix.loc['Gold', '10Y_Yield']

        interpretation = f"""
CORRELATION INTERPRETATION:
───────────────────────────────────

NQ vs Gold: {nq_gold:.4f}
  → {"Positive: Move together" if nq_gold > 0.5 else "Moderate: Sometimes together" if nq_gold > 0 else "Negative: Move opposite"}
  → Hedge effectiveness: {"Good" if 0.3 < nq_gold < 0.7 else "Poor"}

NQ vs 10Y Yield: {nq_yield:.4f}
  → {"Strong inverse: Major driver" if nq_yield < -0.6 else "Moderate inverse" if nq_yield < -0.3 else "Weak inverse"}
  → Risk factor: {"HIGH - Watch yields closely" if nq_yield < -0.6 else "MODERATE" if nq_yield < -0.3 else "LOW"}

Gold vs 10Y Yield: {gold_yield:.4f}
  → {"Positive: Move together" if gold_yield > 0.5 else "Weak: Limited relationship" if gold_yield > -0.3 else "Negative: Inverse"}

TRADING INSIGHT:
───────────────────────────────────
10Y Yield is the PRIMARY driver of NQ moves ({nq_yield:.4f})
Gold provides {"good" if 0.3 < nq_gold < 0.7 else "poor"} hedging ({nq_gold:.4f})

ACTION:
→ Monitor 10Y yield closely for early warning signs
→ Rising yields = Risk to long MNQ positions
→ Use Gold hedge when yields volatile
"""
        return interpretation

    def print_summary(self):
        """Print full analysis summary"""
        print(f"\n{self.name} - ANALYSIS SUMMARY")
        print("=" * 60)
        print("\nCorrelation Matrix:")
        print(self.calculate_correlation_matrix().round(4))
        print(self.get_correlation_interpretation())


# Example usage:
print("\nExample Usage:")
print("─" * 60)

analyzer = CorrelationAnalyzer(name="My Trading Correlations")
analyzer.add_data(
    dates=df['Date'].tolist(),
    nq_prices=df['NQ'].tolist(),
    gold_prices=df['Gold'].tolist(),
    yield_data=df['10Y_Yield'].tolist()
)
analyzer.print_summary()

# ============================================================================
# PART 5: Practical Trade Decision Making
# ============================================================================

print("\n" + "=" * 80)
print("PART 5: USING CORRELATION FOR TRADE DECISIONS")
print("=" * 80)


class TradeDecisionSystem:
    """
    Use correlation data to make trading decisions
    """

    def __init__(self, correlation_matrix):
        self.corr = correlation_matrix

    def should_hedge_long_nq(self):
        """Determine if hedging long NQ with Gold is worthwhile"""
        nq_gold_corr = self.corr.loc['NQ', 'Gold']

        # Good hedge if correlation between 0.3 and 0.7
        if 0.3 < nq_gold_corr < 0.7:
            hedge_ratio = 0.5 + (0.7 - nq_gold_corr) * \
                2  # Adjust based on corr
            return True, hedge_ratio
        elif nq_gold_corr < 0.3:
            return False, 0  # Hedge too weak
        else:
            return False, 0  # Too correlated, hedge ineffective

    def yield_risk_level(self):
        """Assess risk from 10Y yield movements"""
        nq_yield_corr = self.corr.loc['NQ', '10Y_Yield']

        if nq_yield_corr < -0.7:
            return "HIGH", "Yields are strong driver, watch closely"
        elif nq_yield_corr < -0.4:
            return "MEDIUM", "Yields matter, monitor for changes"
        else:
            return "LOW", "Yields not major factor today"

    def position_sizing_recommendation(self):
        """Recommend position size based on correlations"""
        nq_yield_corr = self.corr.loc['NQ', '10Y_Yield']
        nq_gold_corr = self.corr.loc['NQ', 'Gold']

        risk_score = abs(nq_yield_corr)  # Higher = more volatile

        if risk_score > 0.7:
            return "Small (1-2 contracts max)", "High yield sensitivity"
        elif risk_score > 0.4:
            return "Medium (2-4 contracts)", "Moderate sensitivity"
        else:
            return "Normal (4-6 contracts)", "Low sensitivity"

    def print_trade_plan(self):
        """Print complete trade plan based on correlations"""
        should_hedge, ratio = self.should_hedge_long_nq()
        yield_risk, yield_note = self.yield_risk_level()
        size, size_note = self.position_sizing_recommendation()

        plan = f"""
TRADE DECISION SYSTEM - POSITION PLAN
═════════════════════════════════════════════════════════════

SCENARIO: You want to go LONG 1 /MNQ

1. HEDGE DECISION:
   Hedge with Gold? {"YES" if should_hedge else "NO"}
   Recommended ratio: {ratio:.2f} MGC per 1 MNQ
   Why: NQ-Gold correlation = {self.corr.loc['NQ', 'Gold']:.4f}

2. YIELD RISK ASSESSMENT:
   Risk Level: {yield_risk}
   Details: {yield_note}
   NQ-Yield correlation: {self.corr.loc['NQ', '10Y_Yield']:.4f}

3. POSITION SIZING:
   Recommended size: {size}
   Reasoning: {size_note}

4. STOP LOSS PLACEMENT:
   Wider stops if yielding {"falling" if self.corr.loc['NQ', '10Y_Yield'] < -0.6 else "unknown"}
   Tighter stops if yields rising
   Adjust based on yield movements

5. PROFIT TAKING:
   Hold longer if yields falling (tailwind)
   Take profits quickly if yields rising (headwind)

6. DAILY CHECKLIST:
   ☐ Check current 10Y yield vs yesterday
   ☐ Check current correlation status
   ☐ Adjust stops accordingly
   ☐ Monitor for yield spikes during session
"""
        return plan


# Use the decision system
print("\nExample Trading Decision:")
print("─" * 60)

decision_system = TradeDecisionSystem(correlation_matrix)
print(decision_system.print_trade_plan())

# ============================================================================
# PART 6: Save Results to CSV
# ============================================================================

print("\n" + "=" * 80)
print("PART 6: SAVE RESULTS TO CSV")
print("=" * 80)

# Save correlation matrix
correlation_matrix.to_csv('correlation_matrix.csv')
print("✓ Saved correlation_matrix.csv")

# Save rolling correlations
df[['Date', 'NQ_Gold_Corr', 'NQ_Yield_Corr', 'Gold_Yield_Corr']].to_csv(
    'rolling_correlations.csv', index=False)
print("✓ Saved rolling_correlations.csv")

# Save full analysis
with open('correlation_analysis.txt', 'w') as f:
    f.write("3-ASSET CORRELATION ANALYSIS\n")
    f.write("=" * 80 + "\n\n")
    f.write("Correlation Matrix:\n")
    f.write(correlation_matrix.to_string())
    f.write("\n\n")
    f.write(decision_system.print_trade_plan())

print("✓ Saved correlation_analysis.txt")

print("\n" + "=" * 80)
print("COMPLETE! You now have correlation analysis in Python")
print("=" * 80)
