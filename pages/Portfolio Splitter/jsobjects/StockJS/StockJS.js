export default {
  tickers: ["MSFT","IBM","IONQ","QBTS","QUBT","RGTI","WKEY","LAES","SEER","HON"],

  // "$232.14" -> 232.14
  _toNum(v) {
    if (v == null) return 0;
    const s = String(v);
    const m = s.match(/[\d.]+/g);
    return m ? Number(m.join("")) : 0;
  },

  // Fetch all prices in parallel and store
  async refresh() {
    const results = await Promise.all(
      this.tickers.map(t =>
        QuoteAPI.run({ symbol: t })
          .then(res => [t, this._toNum(res?.body?.primaryData?.lastSalePrice)])
          .catch(() => [t, 0])
      )
    );
    const out = Object.fromEntries(results);
    await storeValue("prices", out);
    return out;
  },

  // Read stored prices
  prices() {
    const p = appsmith.store.prices || {};
    const map = {};
    this.tickers.forEach(t => (map[t] = Number(p[t] || 0)));
    return map;
  },

  // Build allocation rows (10% each)
  rows(amount) {
		const amt = Number(amount || 0);
		const perBucket = amt / this.tickers.length;   // 10 equal buckets
		const fee = 0.56;                               // per trade fee
		const p = this.prices();

		// round DOWN to cents to avoid overshoot from rounding up
		const floor2 = (x) => Math.floor((Number(x) + 1e-9) * 100) / 100;

		let totalSpend = 0;

		const rows = this.tickers.map((t) => {
			const price = Number(p[t] || 0);
			let shares = 0;
			let shareCost = 0;
			let total = 0;
			let leftover = perBucket;

			if (price > 0 && perBucket > fee) {
				const funds = perBucket - fee;                         // cash available for shares after fee
				const rawShares = funds / price;
				shares = Math.floor(rawShares * 1000) / 1000;          // fractional shares, 3 dp
				shareCost = floor2(shares * price);                    // cost of shares (down to cents)
				total = floor2(shareCost + fee);                       // shares + fee, down to cents

				// Safety: if rounding still pushed it over, back off 0.001 share and recalc
				if (total > perBucket) {
					shares = Math.max(0, shares - 0.001);
					shares = Math.floor(shares * 1000) / 1000;
					shareCost = floor2(shares * price);
					total = floor2(shareCost + fee);
				}

				leftover = floor2(perBucket - total);
			} else {
				// not enough to cover fee or no price
				shares = 0;
				shareCost = 0;
				total = floor2(Math.min(perBucket, fee));
				leftover = floor2(perBucket - total);
			}

			totalSpend += total;

			return {
				ticker: t,
				price,
				bucket: floor2(perBucket),
				shares,
				shareCost,   // shares only
				fee,
				total,       // shares + fee
				leftover
			};
		});

		const totalLeftover = floor2(amt - totalSpend);

		return rows.map((r) => ({
			...r,
			totalSpend: floor2(totalSpend),
			totalLeftover
		}));
	}
};
