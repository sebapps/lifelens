/*
LifeLens
CDS Webhook
Orlando Soto
*/
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const OPENAI_API_KEY = "<<YOUR API KEY HERE>>"

app.get("/cds-services", (req, res) => {
    res.send({
        services: [{
                hook: "patient-view",
                title: "LifeLens",
                description: "A clear vision towards health and longevity.",
                id: "0001",
                prefetch: {
                    patient:  "Patient/{{context.patientId}}",
                    conditions: "Condition?patient={{context.patientId}}",
                    medications: "MedicationRequest?patient={{context.patientId}}",
                    observations: "Observation?patient={{context.patientId}}",
                    procedures: "Procedure?patient={{context.patientId}}",
                    diagnosticreports: "DiagnosticReport?patient={{context.patientId}}"
                }
            }
        ]
    });
});

app.post("/cds-services/:id", async (req, res) => {
    
    if(req.params.id === "0001") {
        try {
            let i = 0;
            const fhirData = req.body.prefetch;
            //console.log(fhirData);
            
            const patientName = fhirData.patient.name[0];
            const patientBirthDate = fhirData.patient.birthDate;
            const patientGender = fhirData.patient.gender;

            const conditionsFHIR = fhirData.conditions || [];
            const conditions = [];
            if(conditionsFHIR.hasOwnProperty("entry") && conditionsFHIR.entry.length > 0) {
                for(i=0; i<conditionsFHIR.entry.length; i++) {
                    conditions.push(conditionsFHIR.entry[i].resource.code.text);
                }
            }
            //console.log(conditions);

            const medicationsFHIR = fhirData.medications || [];
            const medications = [];
            if(medicationsFHIR.hasOwnProperty("entry") && medicationsFHIR.entry.length > 0) {
                for(i=0; i<medicationsFHIR.entry.length; i++) {
                    medications.push(medicationsFHIR.entry[i].resource.medicationCodeableConcept.text + " on " + medicationsFHIR.entry[i].resource.authoredOn);
                }
            }
            //console.log(medications);

            const observationsFHIR = fhirData.observations || [];
            const observations = [];
            if(observationsFHIR.hasOwnProperty("entry") && observationsFHIR.entry.length > 0) {
                for(i=0; i<observationsFHIR.entry.length; i++) {
                    if(observationsFHIR.entry[i].resource.hasOwnProperty("valueQuantity"))
                        observations.push(observationsFHIR.entry[i].resource.code.text + " on " + observationsFHIR.entry[i].resource.effectiveDateTime + " Value: " + observationsFHIR.entry[i].resource.valueQuantity.value + observationsFHIR.entry[i].resource.valueQuantity.unit);
                    else if(observationsFHIR.entry[i].resource.hasOwnProperty("valueCodeableConcept"))
                        observations.push(observationsFHIR.entry[i].resource.code.text + " on " + observationsFHIR.entry[i].resource.effectiveDateTime + " Value: " + observationsFHIR.entry[i].resource.valueCodeableConcept.text);
                    else
                    observations.push(observationsFHIR.entry[i].resource.code.text + " on " + observationsFHIR.entry[i].resource.effectiveDateTime + " Value: " + observationsFHIR.entry[i].resource.valueString);
                }
            }
            //console.log(observations)
            
            const proceduresFHIR = fhirData.procedures || [];
            const procedures = [];
            if(proceduresFHIR.hasOwnProperty("entry") && proceduresFHIR.entry.length > 0) {
                for(i=0; i<proceduresFHIR.entry.length; i++) {
                    procedures.push(proceduresFHIR.entry[i].resource.code.text + " on " + proceduresFHIR.entry[i].resource.performedDateTime);
                }
            }
            //console.log(procedures)

            const lifestyleFactorsFHIR = fhirData.careplans || [];
            const lifestyleFactors = [];
            if(lifestyleFactorsFHIR.hasOwnProperty("entry") && lifestyleFactorsFHIR.entry.length > 0) {
                for(i=0; i<lifestyleFactorsFHIR.entry.length; i++) {
                    lifestyleFactors.push(lifestyleFactorsFHIR.entry[i].resource.code.text);
                }
            }
            //console.log(lifestyleFactors)

            // Construct the prompt
            const prompt = `
            Based on the following FHIR patient data, estimate the patient's predicted age of death if no changes are made, 
            and provide actionable recommendations to extend their lifespan:

            **Patient Info**: ${patientName} ${patientBirthDate} ${patientGender}
            **Conditions**: ${conditions}
            **Medications**: ${medications}
            **Observations**: ${observations}
            **Procedures**: ${procedures}
            **Lifestyle Factors**: ${lifestyleFactors}

            Please provide:
            1. Estimated lifespan based on the current data.
            2. Specific lifestyle, medical, and behavioral recommendations to extend life expectancy.

            Please keep it very brief, as there is not much space to output this information. Please limit the
            recommendations to two or up to three. Please start each new recommentation with the \n newline character.
            Please follow this format:
            **Predicted Lifespan**: [Estimated Age] \n\n
            **Recommendations**: [Recommendations] [Each recommendation should be preceded by a newline and number and dot. Example: \n1., \n2., etc.]
            `;
            
            // Call OpenAI API (ChatGPT-4o)
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-4o',
                    temperature: 0.15,
                    messages: [{ role: 'system', content: "You are a medical AI assistant." }, { role: 'user', content: prompt }],
                    max_tokens: 500
                },
                { headers: { 'ngrok-skip-browser-warning' : 'true', 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' } }
            );

            const aiResponse = response.data.choices[0].message.content;
            
            // Format CDS Hooks response
            res.json({
                cards: [
                    {
                        summary: "LifeLens Results",
                        detail: aiResponse,
                        source: { label: "LifeLens", url: "https://github.com/sebapps/lifelens" },
                        indicator: "info"
                    }
                ]
            });
        } catch (error) {
            console.error("Error generating CDS Hooks response:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
});

app.listen(4444, () => console.log("started!"));
