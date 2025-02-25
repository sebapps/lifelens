# LifeLens
LifeLens - A clear vision towards health and longevity

# Purpose
This project is part of the Devpost Predictive AI in Healthcare with FHIR hackathon.
It aims to predict the patient's life expectancy and gives some recommendations in order for the patient to live longer via a healthier lifestyle.

# How it works
As it is a CDS webhook, when a patient is viewed, the webhook is launched. It obtains the following patient information:

1. Name, age and gender
2. Conditions
3. Medications
4. Observations
5. Procedures
6. Lifestyle Factors

And then feeds this all into ChatGPT-4o to predict the patient's life expectancy and also give them some tips to live longer.

# Predictive accuracy
Since it uses the advanced ChatGPT-4o LLM and utilizes the patient's age, gender and medical history, the accuracy should be very precise.

# Potential impact
LLM for Healthcare can greatly improve patients' outlooks, longevity and lifestyle. A patient that may not like the lifespan expectation
that he or she sees, can modify their current situation or habits, hopefully increasing that number.
