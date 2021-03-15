---
title: "IRS v BTC"
date: 2021-03-01
description: "How to pay your taxes when Coinbase doesn't talk to turbotax"
---


## Background
This year in TurboTax, the paywall maze willed into existance by [lobbying](https://gimletmedia.com/shows/reply-all/6nhgol), a question pops up asking me if I've sold or received cryptocurrency in 2020. I answer as any techy mellenial would, and I wind up being cornered into paying for TurboTax Premier for "cryptocurrency support". Coinbase on their [reports](https://www.coinbase.com/reports) page, similary advertises a TurboTax cupon code to allow compaibility.

The problem is that the two systems are not compatible. What follows is the uncovering of a rather large miscommunication between two large companies.

## "Ask your Mom" "Ask your Dad"
Following along with the instructions, TurboTax UI throws an error that the column names are wrong. It's not that the file format is wrong; Coinbase produces a `.csv` (Comma Separated Values- Excel sheet with commas) and TurboTax accepts `.csv`'s. The problem is _what's calculated_ inside the csv.
Coinbase procuces a simple log of transactions, with the columns: 

    Timestamp,Transaction Type,Asset,Quantity Transacted,USD Spot Price at Transaction,USD Subtotal,USD Total (inclusive of fees),USD Fees,Notes
TurboTax, however, is looking for this[^1]:

    ASSET NAME,RECEIVED DATE,COST BASIS(USD),DATE SOLD,PROCEEDS

It's not that the naming is wrong either. They're looking for _proceeds_.

## What is actually needed
Say I buy one bitcoin for one dollar last week (can you imagine?). This week, I buy another bitcoin two dollars. Immediately after, the price went way up and I sell one token for ten dollars, keeping the other one just in case.

Next year, I have to tell the IRS _which token_ I sold when in order to report profit. If I sold the first one, I made $9 USD in profit, but if I sold the second one, I only reveal $8 USD in profit to the Tax-Man. The first way is known as FIFO (First In, First Out). The second is LIFO (Last In, First Out) and is more favorable when the price generally rises.

I'm currently working on some code that will calculate this on the coinbase file but I still have a few challenges

## Questions
- Do I have to choose between either LIFO or FIFO? HIFO (Highest In, First Out) has the best results but doesn't differ significantly.
- Can I split a buy transaction to cover the exact amount I sold when calculating cost basis? Robinhood seems to do this.
  - If the answer is yes, do I split the fees evenly as well? Am currently doing this.
- I am recording how much of each buy asset I am attributing to cost basis in an output csv. do we have to save this between years?
- (Extra paranoid) How exact do the calculations have to be? Cryptocurrency goes way beyond three decimal points, wondering where rounding errors come into play.


[1^]: I discovered this by successfully uploading my Robinhood cryptocurrency tax csv and comparing the differences. Just wanted to give Robinhood for being on top of this. I used their format as a model for future calculations.


[2^]: Don't take my word for it; [here](https://ttlc.intuit.com/community/taxes/discussion/coinbase-csv-file-not-compatible-on-turbotax-no-headers-found-in-this-file-error/00/1820285/page/_16) is the latest forum page of enraged TurboTax users.