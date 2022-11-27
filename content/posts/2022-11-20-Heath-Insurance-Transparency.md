---
title: "Health Insurance Transparency"
date: 2022-01-01
description: "How much did the real payers pay?"
draft: true
---

## A Song of Charge Books and Actuaries
Insurance is a simple question with a complicated answer. How can an insurance company pay the minimal amount while still retaining employers as customers. Hospitals (and the providers that compose them) have a similar question: how can I charge the most that insurance companies and patients will actually pay. This battle happens on the other side of the curtain. They know virtually nothing until they receive their bill submitted through insurance. This provider-insurance battle is well reported on and results in the wild differences in costs of procedures. Even if they could pick their provider, how will they know which decision would actually cost less? I've experienced this and so has anyone else with the misfortune of requiring medical services. In an effort to rebalance the information, the US government has [forced](https://www.npr.org/sections/health-shots/2022/07/27/1113091782/health-insurance-prices-for-care-are-now-out-there-but-finding-them-is-an-ordeal) health insurance companies to make "machine readable" files and place them on the open internet.

Is there actually useful information in these files? If so, is there an insight that can be derived from multiple insurance companies? Or, does malicious compliance previal and we are just left with more confusion?

Let's try to take a look at these files and see what we can find.

## Case Study: United Healthcare

Starting with the largest insurer by market share, United Healthcare (UHC), we find their disclosure URL https://transparency-in-coverage.uhc.com/ and try to download a couple files for the month of November, 2022. There are 59,728 files just for November. And next month, I'm not sure what will happen to these files. Do they just get replaced by December's files? I wouldn't be able to know the total download size, but it would definitely hit my current ISP cap. This is yet another reminder of how convoluted our system has become. It started off with employers negotiating group rates and has become the defacto requirement. One could probably see from this data which companies in particular are being ripped off and should renegotiate.

This massive pile of loosely structured data is reminicent of the document dump [legal stragegy](https://en.wikipedia.org/wiki/Document_dump#:~:text=A%20document%20dump%20is%20the,the%20receiver%20of%20the%20information). Many of the files exceed the memory of a typical machine and definitely put a strain on disk space in general. My guess is that they took some tables from their database, converted them to json and dumped them to a file. A lot of information is repeated and not efficiently connected together. We only have naming conventions and inferences to go off of.

Are we able to decipher it? 

### General File Types

I picked three JSON files to download: 
- `2022-11-01_-Big-Valley-Construction-LLC_index.json` [link](https://uhc-tic-mrf.azureedge.net/public-mrf/2022-11-01/2022-11-01_-Big-Valley-Construction-LLC_index.json)
  - This is an index file that has links to all of the files associated with this employer, Big Valley Construction, and UHC in the month of November.
- `2022-11-01_Oxford-Health-Insurance-Inc_OHI-Oxford-Value-Option_allowed-amounts.json`
  - This is one of the smaller files I could find and seems to only have a few entries. so we can open it.
  - 
- `2022-11-01_United-Healthcare-Services--Inc-_Third-Party-Administrator_Optum-Health-Behavioral-Services--OHBS--1018476_C2_in-network-rates.json`
  - This file is 20GB. It is nearly impossible to open this with a text editor
  - Optum appears to be a third party administrator of United Healthcare- yet another layer of complexity in this system. 

From a high level, UHC provides all of the rates for each insurer within the UHC network. Each insurer has index

### Large JSON file exploraton
I was unable to open the in-network-rates file on my Macbook with 32 GB of RAM using a typical application. So there were two command line tools used to try to at least get a look at the beginning of the file and then the overall structure.

#### head
`head` is a command that reads the beginning of a file to a certain limit.

#### jq
`jq` is a command line tool that brings JSON exploration to the command line. I wanted to get a

Taking 
