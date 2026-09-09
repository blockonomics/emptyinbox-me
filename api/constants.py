# More explicit version
USDT_DECIMALS = 1_000_000  # 6 decimal places
QUOTA_PER_USDT = 10

BTC_DECIMALS = 100_000_000  # satoshis per BTC

USER_STARTING_QUOTA = 5
AGENT_STARTING_QUOTA = 5

# Quota bundles sold for BTC. Priced so the network fee stays a tolerable
# fraction of the purchase - per-inbox pricing does not survive on-chain fees.
QUOTA_BUNDLES = {
    'starter':  {'quota': 50,  'usd': 5},
    'standard': {'quota': 200, 'usd': 15},
    'bulk':     {'quota': 750, 'usd': 40},
}
DEFAULT_BUNDLE = 'starter'

# A quote is only good while the price behind it is fresh. Expiry stops the
# quote being reused, but a payment that lands late is still credited at the
# quoted rate - refusing coins already sent is worse than eating the drift.
QUOTE_TTL_MINUTES = 15

# Wallets deduct the network fee from the sent amount and the price moves
# between quote and broadcast, so an exact match is not a realistic bar.
UNDERPAYMENT_TOLERANCE = 0.01

# Zero-conf credit is provisional. If the transaction has not reached
# status >= 2 within this window, reconcile.py claws the quota back.
PROVISIONAL_TTL_HOURS = 6

# Cap on quota credited but not yet settled, per user. Bounds the loss from a
# replacement attack to a single bundle.
MAX_PROVISIONAL_INTENTS = 1
