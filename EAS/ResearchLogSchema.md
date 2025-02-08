# ResearchLogSchema

https://easscan.org/schema/view/0x238847e1221a1a5ca60abc68eda91bb2bcd49623819ff275a77cfcdab68a54d1

# Using EAS SDK
```
import  { EAS, SchemaEncoder }  from "@ethereum-attestation-service/eas-sdk";
const easContractAddress = "0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587";
const schemaUID = "0x238847e1221a1a5ca60abc68eda91bb2bcd49623819ff275a77cfcdab68a54d1";
const eas = new EAS(easContractAddress);
// Signer must be an ethers-like signer.
await eas.connect(signer);
// Initialize SchemaEncoder with the schema string
const schemaEncoder = new SchemaEncoder("string ResearchLogSchema,address TriggerWallet,string ScientificName,string SpeciesUID,string[] SpeciesURL,string LLMModelUsed,string IPFSCID,uint16 NumberofInsights,uint16 NumberofCitations");
const encodedData = schemaEncoder.encodeData([
	{ name: "ResearchLogSchema", value: "", type: "string" }
	{ name: "TriggerWallet", value: "0x0000000000000000000000000000000000000000", type: "address" }
	{ name: "ScientificName", value: "", type: "string" }
	{ name: "SpeciesUID", value: "", type: "string" }
	{ name: "SpeciesURL", value: [], type: "string[]" }
	{ name: "LLMModelUsed", value: "", type: "string" }
	{ name: "IPFSCID", value: "", type: "string" }
	{ name: "NumberofInsights", value: "0", type: "uint16" }
	{ name: "NumberofCitations", value: "0", type: "uint16" }
]);
const tx = await eas.attest({
	schema: schemaUID,
	data: {
		recipient: "0x0000000000000000000000000000000000000000",
		expirationTime: 0,
		revocable: true, // Be aware that if your schema is not revocable, this MUST be false
		data: encodedData,
	},
});
const newAttestationUID = await tx.wait();
console.log("New attestation UID:", newAttestationUID);
