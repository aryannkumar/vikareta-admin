/**
 * Vikareta Platform - Unified Authentication System
 * Secure, consistent authentication across all Vikareta modules
 * 
 * This module provides:
 * - Type-safe authentication types
 * - Secure cross-domain SSO
 * - Session management with activity tracking
 * - React hooks for easy integration
 * 
 * Security Features:
 * - HttpOnly cookies for token storage
 * - CSRF protection
 * - Session timeout handling
 * - Cross-domain auth validation
 * - User data validation
 */

// Core types and constants
export * from './vikareta-auth-types';

// Authentication clients
export { vikaretaSSOClient, VikaretaSSOClient } from './vikareta-sso-client';
export { vikaretaCrossDomainAuth, VikaretaCrossDomainAuth } from './vikareta-cross-domain';
export { vikaretaSessionManager, VikaretaSessionManager } from './vikareta-session';

// React hooks
export { useVikaretaAuth, VikaretaAuthProvider, useVikaretaAuthContext } from './hooks/use-vikareta-auth';
export type { UseVikaretaAuthReturn } from './hooks/use-vikareta-auth';