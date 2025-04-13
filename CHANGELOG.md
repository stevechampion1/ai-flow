# Changelog

All notable changes to the AI-Flow project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-03-31

### Added
- Initial project setup with frontend (React) and backend (Express).
- Added `ai_module_models.ts` for type definitions of AI modules.
- Implemented basic workflow routes in `workflowRoutes.ts` for creating and retrieving workflows.
- Added CORS support in `server.ts` to enable frontend-backend communication.

### Fixed
- Resolved module import error in `workflowRoutes.ts` by adjusting `tsconfig.json` (`rootDir` and `include`).
- Updated `AIModule` type to use `id: string` for consistency with `DefaultAIModules`.

### Changed
- Updated `tsconfig.json` to set `rootDir` to `"."` for correct path resolution in the backend.