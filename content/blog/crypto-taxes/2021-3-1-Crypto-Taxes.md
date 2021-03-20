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
There are a slew of "aggregators" mentioned in the forums, but the top option seems to cost about $50 per season.

## What is actually needed
Say I buy one bitcoin for one dollar last week (can you imagine?). This week, I buy another bitcoin two dollars. Immediately after, the price goes way up and I sell one token for ten dollars, keeping the other one just in case.

Next year, I have to tell the IRS _which token I sold_. If I sold the first one, I made $9 USD in profit, but if I sold the second one, I only reveal $8 USD in profit to the Uncle Sam. The first way is known as FIFO (First In, First Out). The second is LIFO (Last In, First Out) and is more favorable when the price generally rises.

I'm currently working on some [code](https://github.com/nickdnickd/taxmycrypto) that will calculate this on the coinbase file but I still have a few challenges.
## Questions
- Do I have to choose between either LIFO or FIFO? HIFO (Highest In, First Out) has the best results but doesn't differ significantly.
- Can I split a buy transaction to cover the exact amount I sold when calculating cost basis? Robinhood seems to do this.
  - If the answer is yes, do I split the fees evenly as well? Am currently doing this.
- I am recording how much of each buy asset I am attributing to cost basis in an output csv. do we have to save this between years? It seems like we do.
- (Extra paranoid) How exact do the calculations have to be? Cryptocurrency goes way beyond three decimal points, wondering where rounding errors come into play.


## Early conclusions
- This now seems to be a case study in the communication breakdowns between large companies as well as between companies and their customers.
- CSV as a file format is fantastic for starting a project, but will quickly break down in the long term since it does not communicate much structure.
- These companies should integrate more tightly, putting the burden on the customer. 
- These customers are in a captive market.




## Disclaimer
None of this is tax advice. Please consult with you financial advisor.


[^1]: I discovered this by successfully uploading my Robinhood cryptocurrency tax csv and comparing the differences. Just wanted to give a shout out to Robinhood for being on top of this. I used their format as a model for the output of the code.


[^2]: Don't take my word for it; [here](https://ttlc.intuit.com/community/taxes/discussion/coinbase-csv-file-not-compatible-on-turbotax-no-headers-found-in-this-file-error/00/1820285/page/_18) is the latest forum page of enraged TurboTax users.