# More explicit version
USDT_DECIMALS = 1_000_000  # 6 decimal places
QUOTA_PER_USDT = 10

BTC_DECIMALS = 100_000_000  # satoshis per BTC

USER_STARTING_QUOTA = 5
AGENT_STARTING_QUOTA = 5

# Quota bundles sold for BTC. Bigger bundles buy a better per-inbox rate,
# because the network fee is a fixed cost the buyer pays on top and it eats a
# far larger share of a small purchase. The smallest bundle matches
# QUOTA_PER_USDT: a dollar must never buy less over BTC than it does over USDT.
QUOTA_BUNDLES = {
    'micro':    {'quota': QUOTA_PER_USDT, 'usd': 1},
    'starter':  {'quota': 50,  'usd': 5},
    'standard': {'quota': 200, 'usd': 15},
    'bulk':     {'quota': 750, 'usd': 40},
}
DEFAULT_BUNDLE = 'starter'

# A caller can also name its own whole-dollar amount instead of a bundle, for
# agents topping up whatever is left in a wallet. The rate is the best bundle
# rate the amount qualifies for, so a custom amount is never a better deal than
# the bundle above it. The lower bound is a product decision about how small a
# purchase is worth supporting, not a technical limit - MIN_PAYMENT_SATS below
# is the technical one, and it bites at a different place.
MIN_CUSTOM_USD = 1
MAX_CUSTOM_USD = 100

# The smallest output a paying wallet will agree to build. Relay dust is not
# our rule to enforce - we only ever receive, and a payer asked for an output
# below the limit gets stopped by its own wallet before anything reaches the
# network. The floor exists so that refusal surfaces here, as an error naming
# the amount, instead of downstream as an opaque wallet failure on a quote we
# had already burned an xPub index to derive.
#
# 546 is the highest dust threshold across the output types an xPub can
# produce (P2PKH 546, P2SH-P2WPKH 540, P2TR 330, P2WPKH 294), so it holds
# whichever kind the registered key yields. It is on the satoshi amount, not
# the dollar amount, so it keeps holding as the price runs: $1 stays payable
# up to roughly $183,000 a coin.
#
# This is not a bound on whether a purchase makes economic sense. The network
# fee the payer adds on top passes a dollar long before the output nears dust,
# and the coins land straight in the merchant wallet, so nothing here pays to
# spend them. Both of those are the buyer's arithmetic, not this check's.
MIN_PAYMENT_SATS = 546

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

# Caps on quota credited but not yet settled, per user. The USD cap is the real
# bound on what a replacement attack can take: one purchase's worth of loss,
# exactly as when a single open intent was the rule. It has to be the largest
# purchase that can legally be quoted, or the cap would reject a first purchase
# on an account with nothing outstanding rather than bounding how much stacks.
# Counting intents no longer bounds anything now that a purchase can be $1, so
# the count cap survives only to keep the outstanding set small enough to scan.
MAX_PROVISIONAL_USD = max(MAX_CUSTOM_USD, *(b['usd'] for b in QUOTA_BUNDLES.values()))
MAX_PROVISIONAL_INTENTS = 5
