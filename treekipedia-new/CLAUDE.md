# Treekipedia Development Guide

## Project Structure
- Root directory `/root/silvi-open/treekipedia-new` contains the main `.env` file
- Each module (`/frontend`, `/backend`, `/contracts`) has its own `package.json` and `node_modules`
- When using environment variables, reference the root `.env` file with the correct path (e.g., `require('dotenv').config({ path: '../.env' })`)

## Build Commands
- Frontend: `cd frontend && yarn dev` (development), `yarn build` (production), `yarn start` (serve production)
- Backend: `cd backend && node server.js` (run server), `nodemon server.js` (dev mode with auto-restart)
- Smart Contracts: `cd contracts && npx hardhat test` (run all tests), `npx hardhat test test/Lock.js` (single test)

## Lint Commands
- Frontend: `cd frontend && yarn lint` (ESLint check)
- Solidity: `cd contracts && npx hardhat check` (Solidity syntax check)

## Code Style Guidelines
- **TypeScript**: Use strict typing with interface definitions in `lib/types.ts`
- **Imports**: Group by: 1) React/framework 2) external libraries 3) internal components/utils
- **Component Structure**: React functional components with explicit typing
- **Naming**: PascalCase for components, camelCase for functions/variables, UPPER_CASE for constants
- **Error Handling**: Always use try/catch blocks with explicit error types
- **File Organization**: Keep related components together, maintain clear separation between frontend/backend/contracts
- **Blockchain**: Follow EIP standards for contract interfaces, document function purposes