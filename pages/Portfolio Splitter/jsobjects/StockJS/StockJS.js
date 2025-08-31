export default {
  // 10 stocks
  tickers: ["MSFT","IBM","IONQ","QBTS","QUBT","RGTI","WKEY","LAES","SEER","HON"],

  // Extract a clean map { TICKER: price }
  prices() {
    const items = QuoteAPI.data?.quoteResponse?.result || [];
    const map = {};
    items.forEach(r => {
      // Yahoo returns symbol & regularMarketPrice
      if (r.symbol) map[r.symbol] = Number(r.regularMarketPrice ?? 0);
    });
    // ensure all symbols exist even if API missed one
    this.tickers.forEach(t => { if (map[t] == null) map[t] = 0; });
    return map;
  },

  // Build table rows given an amount (split 10% each)
  rows(amount) {
    const amt = Number(amount || 0);
    const perBucket = amt / this.tickers.length; // 10% each
    const p = this.prices();
    const out = [];

    let totalSpend = 0;

    this.tickers.forEach(t => {
      const price = Number(p[t] || 0);
      // If price unavailable, zero shares
      let shares = 0;
      let spend  = 0;
      let leftover = perBucket;

      if (price > 0 && perBucket > 0) {
        // buyable shares (down to 3 decimals)
        shares   = Math.floor((perBucket / price) * 1000) / 1000;
        spend    = shares * price;
        leftover = perBucket - spend;
      }

      totalSpend += spend;

      out.push({
        ticker: t,
        price: price,
        bucket: perBucket,
        shares: shares,
        spend: spend,
        leftover: leftover
      });
    });

    // Attach totals for convenience
    const totalLeftover = amt - totalSpend;
    return out.map(r => ({
      ...r,
      totalSpend: totalSpend,
      totalLeftover: totalLeftover
    }));
  }
};
