---
title: "IRS v BTC"
date: 2021-03-01
description: "How to pay your taxes when Coinbase doesn't talk to turbotax"
---


## Crypto grows up
This year in TurboTax, the paywall maze willed into existance by [lobbying](https://gimletmedia.com/shows/reply-all/6nhgol), a question will pop up asking if you've sold or received cryptocurrency in 2020. If you decided to get off the crypto rollercoaster this past year, you will wind up being cornered into paying for TurboTax Premier; for "cryptocurrency support". Coinbase, the largest crypto exchange, similary advertises a TurboTax cupon code to allow compaibility on their [reports](https://www.coinbase.com/reports) page. All you have to do, says Coinbase, is upload their "CSV" to TurboTax.

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

Next year, I have to tell the IRS _which token I sold_. If I sold the first one, I made $9 USD in profit, but if I sold the second one, I only reveal $8 USD in profit to the Uncle Sam. The first way is known as FIFO (First In, First Out). The second is LIFO (Last In, First Out) and is more favorable when the price generally rises because less taxable profit is displayed.

There are a slew of "aggregators" mentioned in the forums, but the top option seems to cost about $50 per season. Furthermore I worry about the potential for "lock in". For example if I use one aggregator, the service would have to remember what I used for cost basis last year. Is this easily transferred to another provider?
I'm currently working on some open source [code](https://github.com/nickdnickd/taxmycrypto) that will calculate this on the coinbase file but I still have a few challenges.
## Questions
- Do I have to choose between either LIFO or FIFO? HIFO (Highest In, First Out) has the best results but doesn't differ significantly.
- Can I split a buy transaction to cover the exact amount I sold when calculating cost basis? Robinhood seems to do this.
  - If the answer is yes, do I split the fees evenly as well? I am currently doing this.
- I am recording how much of each buy asset I am attributing to cost basis in an output csv. do we have to save this between years? It seems like we do. I refer to this above with concerns about lock-in or losing these data.
- (Extra paranoid) How exact do the calculations have to be? Cryptocurrency goes way beyond two decimal points, wondering where rounding errors come into play.


## Early conclusions
- This now seems to be a case study in the communication breakdowns between large companies as well as between companies and their customers. Coinbase and TurboTax had a different understaning and now many customers of both are confused.
- CSV as a file format is fantastic for starting a project, but will quickly break down in the long term since it does not communicate much structure.
  - These companies should integrate more tightly. TurboTax should connect directly to Coinbase's API with limited read permissions.
- These customers (including me) are in a captive market with a very low barrier to entry. It takes 5 mintues to set up a coinbase account for free and start buying and selling cryptocurrency but there isn't much choice to avoid audit exposure without paying the piper.
- This code may eventually manifist into a web service that retains cost basis in a database, but I will leave the core part open source.
  - It would be more secure and less error prone to connect to Coinbase's API and allow users to use oauth to only grant transaction history
  - The user would still need to specify if receiving an asset on an exchange was actually income or an internal transfer from another wallet outside the exchange.



## Disclaimer
None of this is tax advice. Please consult with you financial advisor.


[^1]: I discovered this by successfully uploading my Robinhood cryptocurrency tax csv and comparing the differences. Just wanted to give a shout out to Robinhood for being on top of this. I used their format as a model for the output of the code.


[^2]: Don't take my word for it; [here](https://ttlc.intuit.com/community/taxes/discussion/coinbase-csv-file-not-compatible-on-turbotax-no-headers-found-in-this-file-error/00/1820285/page/_18) is the latest forum page of enraged TurboTax users.