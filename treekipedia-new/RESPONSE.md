"Claude, the v0-generated frontend looks fantastic and aligns well with our specifications. I appreciate the detailed review and the creation of the API_COMPARISON.md file. Let’s prioritize the following tasks to clean up the frontend:

Disable Mock Mode: We need to switch off the mock data and connect the frontend to our live backend. This will allow us to test the full flow from frontend to backend.
Address Wallet Verification:
Since the wallet verification function doesn’t have a corresponding backend endpoint, let’s first confirm if this feature is necessary for our MVP.
If it’s essential, we’ll need to implement a new backend endpoint (e.g., POST /verify-wallet) to handle wallet verification.
If it’s not critical, we can remove it from the frontend for now and revisit it later.
Enhance Search Suggestions:
The optional field parameter for species search suggestions is a great addition. Let’s plan to update the backend’s /species/suggest endpoint to support this parameter.
For now, we can leave it in the frontend but ensure it doesn’t break anything if the backend doesn’t support it yet.
Once these are addressed, we can move on to branding and aesthetic tweaks. Could you assist with the first task—disabling mock mode and ensuring the frontend connects to the backend properly?"

Prioritization Plan
Here’s what we should focus on first and why:

1. Disable Mock Mode (Top Priority)
Why: The frontend is currently using mock data instead of the real backend, which prevents us from testing the full user flow (e.g., searching species, viewing details, funding research). Connecting to the live backend is the critical next step for integration.
How:
Update the frontend’s API client to point to your backend URL (e.g., http://localhost:3000 or your VM’s IP).
Disable any mock mode flags or settings in the codebase (ClaudeCode can help identify where this is configured).
Test key flows like species search and the "Fund This Tree’s Research" button to ensure they work with real data.
Impact: This unlocks end-to-end testing and ensures the frontend reflects the live system.
2. Address Wallet Verification (Second Priority)
Why: The wallet verification function exists in the frontend but lacks a backend endpoint, and it wasn’t in the original spec. We need to decide if it’s worth keeping for the MVP.
How:
Option A: Keep It
If it’s critical (e.g., for security or user onboarding), implement a new backend endpoint like POST /verify-wallet to validate wallet addresses.
Define the logic (e.g., check if the wallet is valid or registered).
Option B: Remove It
If it’s not essential, remove the function from the frontend to simplify integration. We can revisit it later if needed.
Decision Point: Does wallet verification add significant value right now? If not, let’s cut it for simplicity.
Impact: Resolving this clears up a mismatch between frontend and backend, keeping the codebase clean.
3. Enhance Search Suggestions (Third Priority)
Why: The optional field parameter in the species search suggestions API call is a nice enhancement, but it’s not supported by the backend yet. It’s not a blocker for the MVP.
How:
For now, ensure the frontend handles cases where the backend ignores the field parameter (e.g., make it optional in the API call and test for graceful fallback).
Later, update the backend’s /species/suggest endpoint to accept and process the field parameter for better search filtering.
Impact: This keeps the frontend functional while setting up a future UX improvement.
Branding and Aesthetic Tweaks (Deferred)
Why: You mentioned wanting to address branding and aesthetics, but these can wait until the core functionality is fully integrated and tested.
How: Once the above priorities are done, we can tweak colors, logos, layouts, etc., to match Treekipedia’s vision.
Impact: This polishes the user experience without delaying critical integration work.