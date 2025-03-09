# ResearchLogSchema

https://base-sepolia.easscan.org/schema/view/0x879ed82d38bd26318e55e4803c5699f3191e3e9ca2ffbf75d0cdf16524e4d9d3

# Using EAS SDK
```
import  { EAS, SchemaEncoder }  from "@ethereum-attestation-service/eas-sdk";
const easContractAddress = "0x4200000000000000000000000000000000000021";
const schemaUID = "0x879ed82d38bd26318e55e4803c5699f3191e3e9ca2ffbf75d0cdf16524e4d9d3";
const eas = new EAS(easContractAddress);
// Signer must be an ethers-like signer.
await eas.connect(signer);
// Initialize SchemaEncoder with the schema string
const schemaEncoder = new SchemaEncoder("uint256 researchLogID,address triggerWallet,string scientificName,string speciesUID,string[] speciesURL,string llmModel,string ipfsCID,uint16 numberInsights,uint16 numberCitations");
const encodedData = schemaEncoder.encodeData([
	{ name: "researchLogID", value: "0", type: "uint256" }
	{ name: "triggerWallet", value: "0x0000000000000000000000000000000000000000", type: "address" }
	{ name: "scientificName", value: "", type: "string" }
	{ name: "speciesUID", value: "", type: "string" }
	{ name: "speciesURL", value: [], type: "string[]" }
	{ name: "llmModel", value: "", type: "string" }
	{ name: "ipfsCID", value: "", type: "string" }
	{ name: "numberInsights", value: "0", type: "uint16" }
	{ name: "numberCitations", value: "0", type: "uint16" }
]);
const tx = await eas.attest({
	schema: schemaUID,
	data: {
		recipient: "0x0000000000000000000000000000000000000000",
		expirationTime: 0,
		revocable: false, // Be aware that if your schema is not revocable, this MUST be false
		data: encodedData,
	},
});
const newAttestationUID = await tx.wait();
console.log("New attestation UID:", newAttestationUID);
