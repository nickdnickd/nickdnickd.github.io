---
title: "Health Insurance Transparency"
date: 2022-01-01
description: "How much did the real payers pay?"
draft: false
---

## A Song of Charge Books and Actuaries

Insurance is a simple question with a complicated answer:

_How can an insurance company pay the minimal amount while still retaining employers as customers?_

Hospitals (and the providers of which they're composed) have a similar question:

_How can I charge the most that enough insurance companies and patients will pay to be profitable?_

This battle happens on the other side of the curtain and patients know virtually nothing until they receive their bill submitted through insurance automatically. This provider-insurance battle is well reported on and results in the wild differences in costs of procedures. A safe guess is just "thousands of dollars". I've experienced this and so has anyone else with the misfortune of requiring medical services. No procedures done and a CT resulted in a $5000 bill right when I was switching employers.

It feels good to think about a total overhaul of a system that centers around comapnies (our employers, our insurers, our hospitals) lording over our financial stability and well being. But it also feels pretty unrealistic.
In an effort to slowly unwind this web, the US government has [forced](https://www.npr.org/sections/health-shots/2022/07/27/1113091782/health-insurance-prices-for-care-are-now-out-there-but-finding-them-is-an-ordeal) health insurance companies to make "machine readable" files and place them on the open internet detailing the costs and what portion they've agreed to cover.
Is there actually useful information in these files? If so, is there an insight that can be derived from multiple insurance companies? Or, does malicious compliance previal and we are just left with more confusion? Or have armies of actuaries and developers made something too complicated to dissect by accident?
Let's try to take a look at these files and see what we can find.

## Case Study: United Healthcare

Starting with the largest insurer by market share (source: lazy google), United Healthcare (UHC), we find their disclosure URL https://transparency-in-coverage.uhc.com/ and try to download a couple files for the month of November, 2022. There are 59,728 files just for November. And next month, they're gone; replaced by the following month. The the old URLs still work however, so we could go backwards and guess the original date. I wouldn't be able to know the total download size each month, but it would definitely hit my current ISP cap. This massive pile of loosely structured data is reminicent of the document dump [legal stragegy](https://en.wikipedia.org/wiki/Document_dump#:~:text=A%20document%20dump%20is%20the,the%20receiver%20of%20the%20information). Right away, this has turned into something that requires a cloud solution due to data size and scale. AWS stands out with cheap ingress and the use of cheap lambdas for quick jobs and maybe ECS/Batch for the bigger jobs. But for now let's explore locally.

My guess is that they took some tables from their database, converted them to json and dumped them to a file. A lot of information is repeated and not efficiently connected together. You can see below just how much repitition there is by comparing the compressed size of the json with the uncompressed size. Something like a SQL database could save space and be queried and joined more efficiently.

![png](/compression_example.png)

Are we able to decipher it?

### General File Types

I picked three JSON files to download:

- `2022-11-01_-Big-Valley-Construction-LLC_index.json` [link](https://uhc-tic-mrf.azureedge.net/public-mrf/2022-11-01/2022-11-01_-Big-Valley-Construction-LLC_index.json)
  - This is an index file that has links to all of the files associated with this employer, Big Valley Construction, and UHC in the month of November.
- `2022-11-01_Oxford-Health-Insurance-Inc_OHI-Oxford-Value-Option_allowed-amounts.json`
  - This is one of the smaller files I could find and seems to only have a few entries. so we can open it.
- `2022-11-01_United-Healthcare-Services--Inc-_Third-Party-Administrator_Optum-Health-Behavioral-Services--OHBS--1018476_C2_in-network-rates.json`
  - This file is 20GB. It is nearly impossible to open this with a text editor
  - Optum appears to be a third party administrator of United Healthcare- yet another layer of complexity in this system.

From a high level, UHC provides all of the rates for each insurer within the UHC network. Each insurer has index

### Large JSON file exploration

I was unable to open the in-network-rates file on my Macbook with 32 GB of RAM using a typical application. So there were two command line tools used to try to at least get a look at the beginning of the file and then the overall structure.

#### head

`head` is a command that reads the beginning of a file to a certain limit. Often times there is high level information in the beginning of the file such as metadata. And if we're lucky we can see a picture of the file structure.

For the sake of formatting, I placed an elipsis `...` and closing parens/braces to show the rest of the file.
In reality, head cuts the file off in this object.

```shell
nickd@Nicholass-MBP nickdnickd.github.io % head -c 5000 /Users/nickd/Downloads/2022-11-01_United-Healthcare-Services--Inc-_Third-Party-Administrator_Optum-Health-Behavioral-Services--OHBS--1018476_C2_in-network-rates.json

{
    "reporting_entity_name": "United Healthcare Services, Inc.",
    "reporting_entity_type": "Third-Party Administrator",
    "last_updated_on": "2022-11-01",
    "version": "1.0.0",
    "provider_references": [
        {"provider_groups": [{"npi": [1992876700], "tin": {"type": "ein", "value": "581568370"}}], "provider_group_id": 0},
        {"provider_groups": [{"npi": [1710098942], "tin": {"type": "ein", "value": "204703841"}}], "provider_group_id": 1},
        {"provider_groups": [{"npi": [1215993100], "tin": {"type": "ein", "value": "621600268"}}], "provider_group_id": 2},
        {"provider_groups": [
            {"npi": [1740267806, 1649784232, 1174520670, 1447632450, 1922329622], "tin": {"type": "ein", "value": "208608207"}},
            {"npi": [1154522944, 1568498475, 1144203233, 1528215340], "tin": {"type": "ein", "value": "562492885"}},
            {"npi": [1265106967], "tin": {"type": "ein", "value": "452317099"}},
            {"npi": [1932145422], "tin": {"type": "ein", "value": "854304920"}},
            {"npi": [1114195302], "tin": {"type": "ein", "value": "900449008"}},
            {"npi": [1447693833], "tin": {"type": "ein", "value": "824863664"}},
            {"npi": [1104910157, 1144314105], "tin": {"type": "ein", "value": "261956018"}},
            ...
        ]}
    ]
}
```

You can see that we do indeed see high level information, as well as the beginning of a provider_references table. This seems to be a mapping of EIN (Employee ID Number) to multiple National Provider ID's (NPIs). I suppose this is so that you could tell what providers are In-Network.

#### jq

`jq` is a command line tool that brings JSON exploration to the command line.
I just wanted to see what other parts of the file we were missing from the highest level.

So I ran `time jq 'keys' <filepath>` to get a sense of how long it takes to scan the file for just the high level keys.

![png](/jq_results.png)

Two observations here:

- The only key left is `in_network`
- This took 20 minutes to run on my laptop. About 1 minute per GB.

Can we use jq to scan the keys inside `'in_network'` as well? Will it also take 20 minutes?

Thanks to [Stack Overflow](https://stackoverflow.com/a/33630944/3062390), I am running the below command to see what we can get
`time jq '.in_network | map_values(keys)' <file_name>`

While I'm waiting on this, I'm going to try to look at the _end_ of the file to see if the structure is revealed.

```json

{ // Top level of the file (see above)
    "in_network": [
        { // There are more keys here, this will hopefully be revealed by the jq run above
            [ 
                {
                    "provider_references":[6137],
                    "negotiated_prices":[
                        {"negotiated_rate":42.0,"service_code":["11"],"negotiated_type":"negotiated","expiration_date":"9999-12-31","billing_class":"professional","billing_code_modifier":[],"additional_information":""}
                    ]
                },
                {
                    "provider_references":[22925],
                    "negotiated_prices":[
                        {"negotiated_rate":42.0,"service_code":["11"],"negotiated_type":"negotiated","expiration_date":"9999-12-31","billing_class":"professional","billing_code_modifier":[],"additional_information":""}]},
                {
                    "provider_references":[55590],
                    "negotiated_prices":[
                        {"negotiated_rate":42.0,"service_code":["11"],"negotiated_type":"negotiated","expiration_date":"9999-12-31","billing_class":"professional","billing_code_modifier":[],"additional_information":""}
                    ]
                },
                {
                    "provider_references":[24563],
                    "negotiated_prices":[
                        {"negotiated_rate":0.0,"service_code":[],"negotiated_type":"negotiated","expiration_date":"9999-12-31","billing_class":"institutional","billing_code_modifier":[],"additional_information":""}
                    ]
                }
            ]
        }
    ]
}
```

#### python ijson

There's another way. We can use `ijson`, which helps keep the memory profile low (Thank you to [Itamar's Blog post](https://pythonspeed.com/articles/json-memory-streaming/#a-streaming-solution))
It's a python library but a lot of the implementation is in C.


```python
import ijson

test_file = "2022-11-01_United-Healthcare-Services--Inc-_Third-Party-Administrator_Optum-Health-Behavioral-Services--OHBS--1018476_C2_in-network-rates.json"
large_file_path = f"/Users/nickd/Downloads/{test_file}"
# downloaded from https://transparency-in-coverage.uhc.com/

with open(large_file_path, "rb") as f:
    for item in ijson.items(f, "in_network.item"):
        print(item.keys())
        print(item["negotiation_arrangement"])
        print(item["name"])
        print(item["billing_code_type"])
        print(item["description"])
        print(item["negotiated_rates"][0])
        print(item["negotiated_rates"][1])
        break

```

We got the keys of one of the negotiation arrangements. This seems to be a line item that we can disect.

```shell
# result
dict_keys(['negotiation_arrangement', 'name', 'billing_code_type', 'billing_code_type_version', 'billing_code', 'description', 'negotiated_rates'])
ffs
IMM ADMN SARSCOV2 30MCG/0.3ML DIL RECON 1ST DOSE
CPT
Immunization administration by intramuscular injection of severe acute respiratory syndrome coronavirus 2 (SARS-CoV-2) (coronavirus disease [COVID-19]) vaccine, mRNA-LNP, spike protein, preservative free, 30 mcg/0.3mL dosage, diluent reconstituted; first dose
{'provider_references': [30801], 'negotiated_prices': [{'negotiated_rate': Decimal('42.88'), 'service_code': ['11'], 'negotiated_type': 'negotiated', 'expiration_date': '9999-12-31', 'billing_class': 'professional', 'billing_code_modifier': [], 'additional_information': ''}]}
{'provider_references': [14057], 'negotiated_prices': [{'negotiated_rate': Decimal('67.0'), 'service_code': [], 'negotiated_type': 'negotiated', 'expiration_date': '9999-12-31', 'billing_class': 'institutional', 'billing_code_modifier': [], 'additional_information': 'APC[9397-9397]'}
```

It looks like a covid vaccine!
We printed only two of the rates but you can already see there is a difference in the negotiated_rate.
provider_references seems to be talking about the provider_groups from the beginning of the file, so in a database those will need to be cross referenced.

## Case Study: Anthem
Anthem lays out their disclosure documents a little bit differently
They have one big index file, and within that are the links we need to download.
Let's try some of the tools above on Anthem's index file. Starting with `head` and `tail`

Here's a stitching together `head -c 5000` and `tail -c 5000`.
I cut out some in network files because it was repetitive.

```json
{
  "reporting_entity_name": "Anthem Inc",
  "reporting_entity_type": "health insurance issuer",
  "reporting_structure": [
    {
      "reporting_plans": [
        {
          "plan_name": "HOUSE DRESSING LLC",
          "plan_id_type": "EIN",
          "plan_id": "332545529",
          "plan_market_type": "group"
        }
      ],
      "in_network_files": [
        {
          "description": "BCBS Massachusetts : Blue Care Elect",
          "location": "https://anthembcca.mrf.bcbs.com/2023-01_700_23B0_in-network-rates.json.gz?&Expires=1676568451&Signature=yj-FbqwTsXUklnrAdxD86Eg4YmdxUZKEPO8znLnfH8yY6eKcAA6CViP3tyEGQCn3av2h3etEMaWPH1Zocqxlx3zSL~zXNNEUbkPvuHCkFa7do18mdYDabpDYlflHoLG17RZyy5wunVDUVuHTg4fEB5PSBqvHi2NfC97aCr3rUywYiyC~1uCkVUgABxE9HBQGAqBnPQ11dLdYPc58KhCyw9gXxT9lnuONydjglbYq-mhOaDfPGKEp3u1w4b7sInO2NhzeTOiJpFWpD~rAypTTMt9~yPvzT64vnbyBzAKYDm3gJZNUyS~ZNORvBsv0BPPeMvRABziyfUcnVbdMHcgPfQ__&Key-Pair-Id=K27TQMT39R1C8A"
        },
        {
          "description": "BCBS Tennessee, Inc. : Network P",
          "location": "https://anthembcca.mrf.bcbs.com/2023-01_890_58B0_in-network-rates_54_of_60.json.gz?&Expires=1676568451&Signature=c82FwUx1tjbqk3nsE~-wYjDHf7-PnTEYcuy3f29M5wQkoMEDefWq7KPyCKat8octGiiOCdE3ELFj~PyHphIITSIA6yWtByOKrZn2~qPRE92LmvkHeSYZHHl4nM9Aa1e70qjPKc3hRD6me2zh454fqMrRJuaFiD-XeX8qnZO-WLLKSB~-94iRCNCIjVX0U3CDvt9rlOj3DZ2em3Qt5XNEzzfCIZaFNbqgNzlV8t3UTRL7O4~vkQroZtxw4VZodbwPA7~Mny3BK8u5NtKmu2mQcE9Cap6v4Kt~j91W5XE54M6u~AUDIM0K3UIrCumdR4iYIgzJ5F8IwtOONW93NWyFbA__&Key-Pair-Id=K27TQMT39R1C8A"
        },
        {
          "description": "BCBS Minnesota : Aware",
          "location": "https://anthembcca.mrf.bcbs.com/2023-01_720_27B0_in-network-rates_58_of_74.json.gz?&Expires=1676568451&Signature=UMTaVyMfuuH1EtDYmH4CuMd5Hoxk9xo-yUerYyhNLsQDjPbEsmqI9MxO-Y7c3t6zUb7DzemfTR2cm6OEnDIZmJ47QUa4m4Br07bTruMMtMFinN9x2Kg~w8WULnEiJb-tje~LTo8~Mo4xiNSa5eVjZlnMtpIplLTXpXyEKynStuzIpho5SyhqrMhYjShH3~s-bM88ZF7caELsD-kL64fi~PimlvDljHCzknlQ5Ymd86tozzGUNbA9qZXy6Z300biREY3ztE41SZyE8F128vYZGMoPZANOQjmFFXn8lCY2oDWEHWfyMYOckntO31m40nHkvk9k1~KebC0dbTNMFowICg__&Key-Pair-Id=K27TQMT39R1C8A"
        }
      ]
    }
  ],
  "allowed_amount_files":
    {
        "description":"Out-of-Network Allowed Amounts Files",
        "location":"https://antm-pt-prod-dataz-nogbd-nophi-us-east1.s3.amazonaws.com/anthem/2023-01-01_anthem-oon-multiplan-empty_allowed-amounts.json.gz"
    }
}
```


The index file looks like
`reporting_entity_name, reporting_entity_type, reporting_structure {reporting_plans, in_network_files}, allowed_amount_files`


## Conclusion
These files are well structured and I believe this can be reassembled in a database at a smaller size that is queryable. The challenge here is that the real dataset is so large that development should run directly against it.