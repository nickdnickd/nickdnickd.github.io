---
title: "IRS v BTC"
date: 2021-03-01
description: "How to pay your taxes when Coinbase doesn't talk to turbotax"
---

### UPDATE
TurboTax has now pulled Coinbase from the list of providers for CSV uploading. While less confusing, the workaround I created no longer allows us to "spoof" a proper CSV. You can still use the output from this blog to enter into TurboTax... but unfortunately it's gotta be manual.

## Crypto grows up
This year in TurboTax, the paywall maze willed into existance by [lobbying](https://gimletmedia.com/shows/reply-all/6nhgol), a question will pop up asking if you've sold or received cryptocurrency in 2020. If you decided to get off the crypto rollercoaster this past year, you will wind up being cornered into paying for TurboTax Premier; for "cryptocurrency support". 

Coinbase, the largest crypto exchange, similary advertises a TurboTax cupon code to allow compaibility on their [reports](https://www.coinbase.com/reports) page. All you have to do, says Coinbase, is upload their "CSV" to TurboTax.

The problem is that the two systems are not actually compatible. What follows is the uncovering of a rather large miscommunication between two large companies.

## Silent hot potato

After happily downloading the `.csv` (Comma Separated Values- Excel sheet with commas instead of lines) from Coinbase in one tab and uploading to TurboTax in another, the TurboTax UI returns an error that the column names are wrong. Coinbase does produce a `.csv`  and TurboTax accepts `.csv`'s. 
However, I found they are actually two different kinds of report. 

Coinbase gives you a simple log of transactions, with the columns: 

    Timestamp,Transaction Type,Asset,Quantity Transacted,USD Spot Price at Transaction,USD Subtotal,USD Total (inclusive of fees),USD Fees,Notes
TurboTax, however, is looking for this [^1]:

    ASSET NAME,RECEIVED DATE,COST BASIS(USD),DATE SOLD,PROCEEDS

Support responses in the TT [forum](https://ttlc.intuit.com/community/taxes/discussion/coinbase-csv-file-not-compatible-on-turbotax-no-headers-found-in-this-file-error/00/1820285/page/_18) vasciate from the mildly confused to the overtly inaccurate.


## What is actually needed
Say I buy one bitcoin for one dollar last week (can you imagine?). This week, I buy another bitcoin at two dollars. Immediately after, the price goes way up and I sell one token for ten dollars, keeping the other one just in case.

Next year, I'll have to tell the IRS _which token I sold_. If I sold the first one, I made $9 USD in profit, but if I sold the second one, I only reveal $8 USD in profit to the Uncle Sam. The first way is known as FIFO (First In, First Out). The second is LIFO (Last In, First Out) and is more favorable when the price generally rises because less taxable profit is displayed.

![fifo_vs_lifo](./fifo_vs_lifo.png)

There are a slew of "aggregators" mentioned in the forums, but the top option seems to cost about $50 per season. Furthermore I worry about the potential for "lock in". For example if I use one aggregator, the service would have to remember what I used for cost basis last year. Is this easily transferred to another provider?
I'm currently working on some open source [code](https://github.com/nickdnickd/taxmycrypto) that will calculate this on the Coinbase file.

At the heart of it is a Coinbase Transaction class that will calculate cost basis so that we don't hav eto pay taxes on the whole asset:

```python
@dataclass
class CoinbaseTransaction:
    """Class for keeping track of transactions."""

    timestamp: datetime
    transaction_type: TransactionType
    asset: AssetType
    quantity_transacted: float
    usd_spot_price_at_transaction: float
    usd_subtotal: float
    usd_total: float  # inclusive of fees
    usd_fees: float

    # How many of this asset did we attribute to profit
    BASIS_COLUMN_NAME = "quantity_attributed_to_profit"
    quantity_attributed_to_profit: float = 0.0

    def cost_basis_usd(self, quantity_considered) -> float:
        """Cost basis is how much we had to spend to acquire this asset
        Includes the list price of the asset plus any fees.
        Since assets are divisible, we attribute the fraction of the fees
        use to buy this assset.
        """

        return quantity_considered * (
            self.usd_spot_price_at_transaction
            + self.usd_fees / self.quantity_transacted
        )

```


## Early conclusions
- This seems to be a case study in the communication breakdowns between large companies as well as between companies and their customers. Coinbase and TurboTax had a different understaning and now many customers of both are confused.
- CSV as a file format is fantastic for starting a project, but will quickly break down in the long term since it does not communicate much structure.
  - These companies should integrate more tightly. TurboTax should connect directly to Coinbase's API with limited read permissions, while Coinbase provide this aggregation as a service.
- These customers (including me) are in a captive market with a very low barrier to entry. It takes 5 mintues to set up a coinbase account for free and start buying and selling cryptocurrency but there isn't much choice to avoid audit exposure without paying the piper.
- This code may eventually manifist into a web service that retains cost basis in a database, but I will leave the core part open source.
  - It would be more secure and less error prone to connect to Coinbase's API and allow users to use oauth to only grant transaction history
  - The user would still need to specify if receiving an asset on an exchange was actually income or an internal transfer from another wallet outside the exchange.



## Disclaimer
None of this is tax advice. Please consult with you financial advisor.


[^1]: I discovered this by successfully uploading my Robinhood cryptocurrency tax csv and comparing the differences. Just wanted to give a shout out to Robinhood for being on top of this. I used their format as a model for the output of the code.


[^2]: Don't take my word for it; [here](https://ttlc.intuit.com/community/taxes/discussion/coinbase-csv-file-not-compatible-on-turbotax-no-headers-found-in-this-file-error/00/1820285/page/_18) is the latest forum page of enraged TurboTax users.