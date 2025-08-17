export default {
	// ---------- ASSETS ----------
	init() {
		if (!appsmith.store.assets) {
			storeValue('assets', [{ id: Date.now(), name: "", amount: "" }]);
		}
		if (!appsmith.store.liabilities) {
			storeValue('liabilities', [{ id: Date.now() + 1, name: "", amount: "" }]);
		}
	},

	// Assets
	addAsset() {
		const list = appsmith.store.assets || [];
		storeValue('assets', [...list, { id: Date.now(), name: "", amount: "" }]);
	},
	setAssetById(id, key, val) {
		if (!["name", "amount"].includes(key)) return;
		const list = appsmith.store.assets || [];
		const updated = list.map(row => row.id === id ? { ...row, [key]: val ?? "" } : row);
		storeValue('assets', updated);
	},
	removeAssetById(id) {
		const list = appsmith.store.assets || [];
		storeValue('assets', list.filter(row => row.id !== id));
	},
	totalAssets() {
		const list = appsmith.store.assets || [];
		return list.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
	},

	// ---------- LIABILITIES ----------
	addLiability() {
		const list = appsmith.store.liabilities || [];
		storeValue('liabilities', [...list, { id: Date.now(), name: "", amount: "" }]);
	},
	setLiabilityById(id, key, val) {
		if (!["name", "amount"].includes(key)) return;
		const list = appsmith.store.liabilities || [];
		const updated = list.map(row => row.id === id ? { ...row, [key]: val ?? "" } : row);
		storeValue('liabilities', updated);
	},
	removeLiabilityById(id) {
		const list = appsmith.store.liabilities || [];
		storeValue('liabilities', list.filter(row => row.id !== id));
	},
	totalLiabilities() {
		const list = appsmith.store.liabilities || [];
		return list.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
	},

	// ---- Helpers
	clamp(n, min, max) { return Math.max(min, Math.min(max, n)); },

	netWorth() {
		const a = this.totalAssets?.() ?? 0;
		const l = this.totalLiabilities?.() ?? 0;
		return a - l;
	},

	// ---- Suggested Monthly Investment/Savings (per person)
	suggestInvestmentPerPerson() {
		const nw = this.netWorth();

		let suggested;
		if (nw <= 0) {
			suggested = 100; // protect cash
		} else if (nw < 10000) {
			suggested = 200; // starter
		} else if (nw < 50000) {
			suggested = Math.round(nw * 0.03 / 12); // ~3%/yr
		} else if (nw < 200000) {
			suggested = Math.round(nw * 0.045 / 12); // ~4.5%/yr
		} else {
			suggested = Math.round(nw * 0.06 / 12); // ~6%/yr
		}

		// Respect baseline of $300, cap at 1500
		return this.clamp(Math.max(300, suggested), 0, 1500);
	},


	// ---- Suggested Monthly Joint Expenditure Contribution (per person)
	suggestJointSpendPerPerson() {
		const nw = this.netWorth();

		let suggested;
		if (nw <= 0) {
			suggested = 50;
		} else if (nw < 10000) {
			suggested = 75;
		} else if (nw < 50000){ 
			suggested = Math.round(nw * 0.012 / 12); // ~1.2%/yr
		} else if (nw < 200000) {
			suggested = Math.round(nw * 0.018 / 12); // ~1.8%/yr
		}
		else {
			suggested = Math.round(nw * 0.024 / 12); // ~2.4%/yr 
		}

		// Respect your baseline $100; also cap to keep practical
		return this.clamp(Math.max(100, suggested), 0, 400);
	},

	// (Optional) Couple totals
	suggestInvestmentCouple() { return this.suggestInvestmentPerPerson() * 2; },
	suggestJointSpendCouple() { return this.suggestJointSpendPerPerson() * 2; },

}
