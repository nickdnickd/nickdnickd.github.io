---
title: "Health Insurance Transparency"
date: 2022-01-01
description: "How much did the real payers pay?"
draft: true
---

## Introduction
Markets claim to be the best medicine for inefficiency, but that is simply not true in the context of anti competitive behavior. Obscurity and secrecy are the means for information asymmetry in the marketplace. The insurance companies know how much that pay and what for, the providers know billing codes and the consumers know virtually nothing until they receive their bill submitted through insurance. I've experienced this and so has anyone else with the misfortune of requiring medical services. In an effort to rebalance the information, the US government has forced to health insurance companies to make machine readable files and provide them on the open internet.

Is there actually useful information in these files? If so can it span across multiple insurance companies? Or if not, does malicious compliance previal and we are just left with more confusion and financial pain?

Let's try to take a look at these files and see what we can find.

NPR link https://www.npr.org/sections/health-shots/2022/07/27/1113091782/health-insurance-prices-for-care-are-now-out-there-but-finding-them-is-an-ordeal


## Case Study United Healthcare

Starting with the largest insurer by market share, United Healthcare (UHC), we find their disclosure URL https://transparency-in-coverage.uhc.com/ and try to download a file that . 

This is a document dump reminicent of the legal stragegy https://en.wikipedia.org/wiki/Document_dump#:~:text=A%20document%20dump%20is%20the,the%20receiver%20of%20the%20information barley meeting the criteria of machine readable covered by the regulation. And why would they?

Are we able to decipher it? This blog seeks to at least explore how in-network rates are constructed from UHC. What are the fields we look at.

From a high level, UHC provides all of the rates for each insurer within the UHC network. Each insurer has index

Taking 

## Conclusion
