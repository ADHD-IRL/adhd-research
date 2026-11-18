# Protocol: umbrella review of the Beyond the Label research areas

Version 1.0, fixed 18 November 2026, before any searching.

## Question
Across the seven areas the Beyond the Label program covers, what do published meta-analyses say about the size, consistency and certainty of effects, and what patterns appear only when the areas are compared with each other?

## Design
Umbrella review (a systematic review of systematic reviews with meta-analysis), followed by a second-order quantitative synthesis of the pooled effects. Not registered. Single extractor per area, with automated and manual verification of every number against its source.

## Areas
- A. Biomarkers and objective measures
- B. Mimics, co-occurring conditions and epidemiology
- C. Mechanisms: reward, delay, effort, time, executive function, emotion
- D. Medicines
- E. Non-drug treatments and supplements
- F. Engagement catalysts and behavioural science of starting tasks
- G. AI and digital methods

## Sources
- Europe PMC REST API (covers PubMed/MEDLINE, PMC and preprints):
  `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=<QUERY>&format=json&pageSize=100&resultType=core`
  - Restrict with `PUB_TYPE:"meta-analysis"` or `(TITLE:"meta-analysis" OR TITLE:"systematic review" OR TITLE:"umbrella")`, and `PUB_YEAR:[2015 TO 2026]`.
  - One record by PMID: `query=EXT_ID:<pmid>%20AND%20SRC:MED&resultType=core` (the `abstractText` field holds the abstract).
- Crossref API for DOI checks. General web search only to locate a named review, guideline (NICE, Cochrane) or trial that the database search missed; record these as "other sources".
- Call the APIs with curl and a generic user agent (`-A "ref-check/1.0"`). Do not send any personal or project details.

## Eligibility
Include:
- Systematic reviews with meta-analysis, network meta-analyses, umbrella reviews, and large consortium mega-analyses, published 2015 to November 2026 (prefer 2020 onward; prefer the most recent and largest when several cover the same question; keep an older landmark if it is still the reference).
- Human participants. ADHD populations, or general or other clinical populations where the construct is one the program uses (for example implementation intentions, acute exercise and executive function, AI diagnostic accuracy).
- Reports a pooled quantitative estimate with a confidence interval, or enough to derive one.

Where no meta-analysis exists for a topic the program relies on, record the single largest or best primary study with `design: "single study"`, or record a row with `es: null` and `design: "no meta-analysis found"`. Gaps are findings.

Exclude: narrative reviews without pooled estimates, animal-only work, non-English, retracted papers, conference abstracts with no data.

## Search log (required)
For every search, record the exact query string, the date, and the hit count returned by the API. Record how many records were screened by title or abstract and how many were included. These feed a flow diagram.

## Extraction: one JSON object per pooled estimate
Write a JSON Lines file (one object per line, UTF-8) with exactly these keys:

```
id            short unique id, e.g. "D-03"
area          "A".."G"
topic         short label, e.g. "Methylphenidate, adults"
comparison    e.g. "drug vs placebo", "ADHD vs controls", "intervention vs control", "diagnostic accuracy"
population    "children" | "adults" | "mixed" | "general population" | "other clinical"
outcome       what was measured, e.g. "ADHD core symptoms"
rater         "clinician" | "self" | "parent" | "teacher" | "blinded" | "unblinded proximal" | "objective task" | "physiological" | "registry" | "not applicable"
metric        "SMD" | "g" | "d" | "OR" | "RR" | "HR" | "r" | "AUC" | "sensitivity" | "specificity" | "accuracy" | "prevalence %" | "h2" | "other"
es            number as reported (keep the source's sign), or null
ci_low        number or null
ci_high       number or null
benefit_sign  +1 if a positive es means "higher in ADHD / favours the intervention", -1 if a negative es does, 0 if not applicable
k             number of studies pooled, or null
n             total participants, or null
i2            heterogeneity I-squared in %, or null
pub_year      year of the review
first_author  surname
journal       journal name
pmid          PubMed id as a string, or null
doi           DOI, or null
design        "meta-analysis of RCTs" | "meta-analysis of observational studies" | "network meta-analysis" | "umbrella review" | "mega-analysis" | "single study" | "no meta-analysis found"
certainty     GRADE or similar if the review states it, else null
seen_in       "abstract" | "full text" | "secondary source"
evidence      the sentence fragment from the source that contains the number, 25 words at most
notes         anything that matters: publication bias, blinded-rater result differs, decline over time, small-study effects, industry funding, who was studied
```

Rules:
- Record only numbers you read in a source during this session. Never fill a number from memory. If you could not see the number, set `es` to null and say so in `notes`.
- Prefer numbers visible in the abstract, since those can be checked automatically. If the number is only in the full text, set `seen_in` to "full text" and give the URL in `notes`.
- When a review gives both an unblinded (proximal) and a blinded (probably blinded) estimate for the same treatment, record both as separate rows. The same applies to children and adults, and to short-term and long-term follow-up.
- When a review reports that effects have shrunk over time, or differ by study quality, sample size or funding, say so in `notes` with the numbers.
- Aim for 20 to 35 rows per area. Coverage of every listed topic matters more than depth on one.

## Notes file
Alongside the data file, write a Markdown notes file with: the search log table; a short paragraph per topic on what the meta-analyses agree and disagree on; gaps where no pooled evidence exists; and anything surprising, especially patterns that cut across topics (effects that depend on who rates the outcome, effects that shrink with year or sample size, measures of variability beating measures of level, results that differ between children and adults, context or incentive effects).

## Synthesis plan (done centrally, after extraction)
1. Verification: every row's number is checked against the Europe PMC abstract by script; rows that fail go to a manual check; rows that cannot be confirmed are dropped from the quantitative synthesis and listed.
2. Harmonise effects to the standardized mean difference scale where valid (OR to d by ln(OR) x sqrt(3)/pi; r to d by 2r/sqrt(1-r^2)); keep accuracy metrics and prevalences separate.
3. Describe the distribution of pooled effects by area and topic, with heterogeneity.
4. Pre-specified cross-area contrasts:
   - C1 rater effect: blinded versus unblinded estimates of the same treatment.
   - C2 time trend: pooled effect against year of publication within topic families (decline effect).
   - C3 precision: effect size against number of studies and participants (small-study effects).
   - C4 level versus variability: measures of average performance versus within-person variability and context contrasts.
   - C5 age: children versus adults for the same treatment or marker.
   - C6 evidence versus use: strength of evidence against how widely an approach is recommended or used in the program's practical advice.
   - C7 catalyst signal: effects grouped by the engagement signal they deliver (urgency, reward, novelty, movement, social presence, autonomy, progress).
5. Exploratory analyses are labelled as exploratory. Pooled estimates from overlapping reviews are not statistically independent, so cross-area statistics are descriptive and hypothesis-generating, not confirmatory.

## Limits stated in advance
Review-level data only; no re-extraction from primary trials; overlap of primary studies between reviews is not quantified; single extractor; English only; one database family.
